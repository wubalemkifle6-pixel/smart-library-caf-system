import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, cafeOrders, fines, users } from "@/db/schema";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { Role, PaymentMethod } from "@/types";

const paymentSchema = z.object({
  orderId: z.number().int().positive().optional(),
  fineId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["cash", "card", "mobile"]),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (currentUser.role === "member") {
      conditions.push(eq(payments.userId, currentUser.id));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: payments.id,
        orderId: payments.orderId,
        fineId: payments.fineId,
        userId: payments.userId,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        status: payments.status,
        transactionReference: payments.transactionReference,
        notes: payments.notes,
        createdAt: payments.createdAt,
        userName: users.fullName,
        orderNumber: cafeOrders.orderNumber,
      })
      .from(payments)
      .leftJoin(cafeOrders, eq(payments.orderId, cafeOrders.id))
      .innerJoin(users, eq(payments.userId, users.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ total: count() })
      .from(payments)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: {
        items: list,
        total: totalResult[0]?.total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await requireAuth();
    const isStaff = ["admin", "cashier"].includes(currentUser.role);
    if (!isStaff && currentUser.role !== "member") {
      return NextResponse.json(
        { success: false, error: "Only cashiers or members can process payments" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = paymentSchema.parse({
      ...body,
      orderId: body.orderId ? Number(body.orderId) : undefined,
      fineId: body.fineId ? Number(body.fineId) : undefined,
      amount: Number(body.amount),
    });

    if (!data.orderId && !data.fineId) {
      return NextResponse.json(
        { success: false, error: "Must specify either orderId or fineId" },
        { status: 400 }
      );
    }

    let targetUserId = currentUser.id;
    let verifiedAmount = data.amount;

    if (data.orderId) {
      const [order] = await db
        .select()
        .from(cafeOrders)
        .where(eq(cafeOrders.id, data.orderId))
        .limit(1);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
      targetUserId = order.userId || currentUser.id;
      verifiedAmount = parseFloat(order.total);
      // Mark order as completed if not already
      if (order.status !== "completed") {
        await db
          .update(cafeOrders)
          .set({ status: "completed", cashierId: currentUser.id, updatedAt: new Date() })
          .where(eq(cafeOrders.id, data.orderId));
      }
    }

    if (data.fineId) {
      const [fine] = await db
        .select()
        .from(fines)
        .where(eq(fines.id, data.fineId))
        .limit(1);
      if (!fine) {
        return NextResponse.json(
          { success: false, error: "Fine not found" },
          { status: 404 }
        );
      }
      targetUserId = fine.userId;
      verifiedAmount = parseFloat(fine.amount);
      if (fine.status === "paid") {
        return NextResponse.json(
          { success: false, error: "This fine has already been paid" },
          { status: 400 }
        );
      }
      // Mark fine paid
      await db
        .update(fines)
        .set({ status: "paid", paidDate: new Date() })
        .where(eq(fines.id, data.fineId));
    }

    const [payment] = await db
      .insert(payments)
      .values({
        orderId: data.orderId,
        fineId: data.fineId,
        userId: targetUserId,
        amount: String(verifiedAmount.toFixed(2)),
        paymentMethod: data.paymentMethod as PaymentMethod,
        status: "completed",
        transactionReference:
          data.transactionReference ||
          `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        processedBy: isStaff ? currentUser.id : null,
        notes: data.notes,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      data: payment,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
