import { NextResponse } from "next/server";
import { db } from "@/db";
import { cafeProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { Role } from "@/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const allowedRoles: Role[] = ["admin", "cafe_staff"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const allowedFields = ["name", "description", "price", "stockQuantity", "isAvailable", "imageUrl"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === "price" ? String(body[field]) : body[field];
      }
    }
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId ? Number(body.categoryId) : null;
    }
    if (body.stockQuantity !== undefined) {
      updateData.stockQuantity = Number(body.stockQuantity);
    }
    const [updated] = await db
      .update(cafeProducts)
      .set(updateData)
      .where(eq(cafeProducts.id, parseInt(id)))
      .returning();
    return NextResponse.json({
      success: true,
      message: "Product updated",
      data: updated,
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only admins can delete products" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await db.delete(cafeProducts).where(eq(cafeProducts.id, parseInt(id)));
    return NextResponse.json({
      success: true,
      message: "Product deleted",
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
