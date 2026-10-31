import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  cafeOrders,
  cafeOrderItems,
  cafeProducts,
  users,
} from "@/db/schema";
import { eq, desc, and, count, ilike, or, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { Role, OrderStatus } from "@/types";
import { generateOrderNumber } from "@/lib/utils";

const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  customerName: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item required"),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (status) {
      conditions.push(eq(cafeOrders.status, status as OrderStatus));
    }
    if (currentUser.role === "member") {
      conditions.push(eq(cafeOrders.userId, currentUser.id));
    }
    if (search) {
      conditions.push(
        or(
          ilike(cafeOrders.orderNumber, `%${search}%`),
          ilike(cafeOrders.customerName || "", `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orders = await db
      .select({
        id: cafeOrders.id,
        orderNumber: cafeOrders.orderNumber,
        customerName: cafeOrders.customerName,
        userId: cafeOrders.userId,
        cashierId: cafeOrders.cashierId,
        status: cafeOrders.status,
        subtotal: cafeOrders.subtotal,
        discount: cafeOrders.discount,
        tax: cafeOrders.tax,
        total: cafeOrders.total,
        notes: cafeOrders.notes,
        createdAt: cafeOrders.createdAt,
        customerUserName: users.fullName,
      })
      .from(cafeOrders)
      .leftJoin(users, eq(cafeOrders.userId, users.id))
      .where(whereClause)
      .orderBy(desc(cafeOrders.createdAt))
      .limit(pageSize)
      .offset(offset);

    // For each order, get items
    const orderIds = orders.map((o) => o.id);
    let items: Array<{
      orderId: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: string;
      subtotal: string;
    }> = [];
    if (orderIds.length > 0) {
      items = await db
        .select({
          orderId: cafeOrderItems.orderId,
          productId: cafeOrderItems.productId,
          productName: cafeOrderItems.productName,
          quantity: cafeOrderItems.quantity,
          unitPrice: cafeOrderItems.unitPrice,
          subtotal: cafeOrderItems.subtotal,
        })
        .from(cafeOrderItems)
        .where(inArray(cafeOrderItems.orderId, orderIds));
    }

    const ordersWithItems = orders.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId === o.id),
    }));

    const totalResult = await db
      .select({ total: count() })
      .from(cafeOrders)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: {
        items: ordersWithItems,
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
    const body = await req.json();
    const data = createOrderSchema.parse(body);

    // Look up products, calculate totals
    const productIds = data.items.map((i) => i.productId);
    const products = await db
      .select()
      .from(cafeProducts)
      .where(inArray(cafeProducts.id, productIds));
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItemsInsert: Array<{
      orderId: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: string;
      subtotal: string;
    }> = [];
    const stockUpdates: Array<{ id: number; newQty: number }> = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ID ${item.productId} not found` },
          { status: 400 }
        );
      }
      if (!product.isAvailable) {
        return NextResponse.json(
          { success: false, error: `"${product.name}" is currently unavailable` },
          { status: 400 }
        );
      }
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${product.name}". Only ${product.stockQuantity} available.` },
          { status: 400 }
        );
      }
      const unitPrice = parseFloat(product.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      orderItemsInsert.push({
        orderId: 0, // will be set after insert
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal.toFixed(2),
      });
      stockUpdates.push({
        id: product.id,
        newQty: product.stockQuantity - item.quantity,
      });
    }

    const discount = data.discount || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(taxable * 0.08 * 100) / 100; // 8% tax
    const total = Math.round((taxable + tax) * 100) / 100;

    const orderNumber = generateOrderNumber();

    const [newOrder] = await db
      .insert(cafeOrders)
      .values({
        orderNumber,
        customerName: data.customerName || "Guest",
        userId: currentUser.role === "member" ? currentUser.id : null,
        cashierId: ["cashier", "admin"].includes(currentUser.role)
          ? currentUser.id
          : null,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes: data.notes,
      })
      .returning();

    // Insert order items with correct orderId
    for (const it of orderItemsInsert) {
      await db.insert(cafeOrderItems).values({ ...it, orderId: newOrder.id });
    }
    // Update stock quantities
    for (const up of stockUpdates) {
      await db
        .update(cafeProducts)
        .set({
          stockQuantity: up.newQty,
          isAvailable: up.newQty > 0 ? true : false,
          updatedAt: new Date(),
        })
        .where(eq(cafeProducts.id, up.id));
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: { ...newOrder, items: orderItemsInsert.map((i) => ({ ...i, orderId: newOrder.id })) },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
