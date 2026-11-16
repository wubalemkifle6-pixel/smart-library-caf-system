import { NextResponse } from "next/server";
import { db } from "@/db";
import { cafeCategories, cafeProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (!["admin", "cafe_staff"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    if (!body.name || String(body.name).trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    const [updated] = await db
      .update(cafeCategories)
      .set({ name: String(body.name).trim(), description: body.description ?? null })
      .where(eq(cafeCategories.id, parseInt(id)))
      .returning();
    return NextResponse.json({ success: true, message: "Category updated", data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Only administrators can delete categories" }, { status: 403 });
    }
    const { id } = await params;
    const catId = parseInt(id);
    const linked = await db.select({ id: cafeProducts.id }).from(cafeProducts).where(eq(cafeProducts.categoryId, catId)).limit(1);
    if (linked.length > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete: products are assigned to this category. Reassign them first." },
        { status: 400 }
      );
    }
    await db.delete(cafeCategories).where(eq(cafeCategories.id, catId));
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
