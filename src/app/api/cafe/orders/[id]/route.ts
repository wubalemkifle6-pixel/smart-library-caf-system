import { NextResponse } from "next/server";
import { db } from "@/db";
import { cafeOrders, cafeOrderItems, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { Role, OrderStatus } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const [order] = await db
      .select()
      .from(cafeOrders)
      .where(eq(cafeOrders.id, parseInt(id)))
      .limit(1);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    if (
      currentUser.role === "member" &&
      order.userId !== currentUser.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const items = await db
      .select()
      .from(cafeOrderItems)
      .where(eq(cafeOrderItems.orderId, order.id));
    return NextResponse.json({
      success: true,
      data: { ...order, items },
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await req.json();
    const { status }: { status: OrderStatus } = body;

    const [order] = await db
      .select()
      .from(cafeOrders)
      .where(eq(cafeOrders.id, orderId))
      .limit(1);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Role permissions:
    // - cafe_staff, admin: pending -> preparing -> ready
    // - cashier, admin: ready -> completed
    // - anyone with permission can cancel pending orders
    const allowedRoles: Role[] = ["admin", "cafe_staff", "cashier"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };
    if (!validTransitions[order.status].includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }
    // Additional check: only cashiers/admins can mark as completed
    if (status === "completed" && !["cashier", "admin"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Only cashiers can mark orders as completed" },
        { status: 403 }
      );
    }

    await db
      .update(cafeOrders)
      .set({ status, updatedAt: new Date(), cashierId: status === "completed" ? currentUser.id : order.cashierId })
      .where(eq(cafeOrders.id, orderId));

    // Notify user
    if (order.userId) {
      const statusMessages: Record<string, { title: string; message: string; type: string }> = {
        preparing: { title: "Order Being Prepared", message: `Your order ${order.orderNumber} is now being prepared.`, type: "info" },
        ready: { title: "Order Ready", message: `Your order ${order.orderNumber} is ready for pickup!`, type: "success" },
        completed: { title: "Order Completed", message: `Your order ${order.orderNumber} has been completed. Thank you!`, type: "success" },
        cancelled: { title: "Order Cancelled", message: `Your order ${order.orderNumber} has been cancelled.`, type: "warning" },
      };
      if (statusMessages[status]) {
        const m = statusMessages[status];
        await db.insert(notifications).values({
          userId: order.userId,
          title: m.title,
          message: m.message,
          type: m.type,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order marked as ${status}`,
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
      { status: 400 }
    );
  }
}
