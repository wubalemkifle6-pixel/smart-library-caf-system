import { NextResponse } from "next/server";
import { db } from "@/db";
import { cafeProducts, cafeCategories } from "@/db/schema";
import { eq, desc, like, and, count, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { Role } from "@/types";

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.union([z.string(), z.number()]),
  stockQuantity: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const inStock = searchParams.get("inStock");
    const available = searchParams.get("available");
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(cafeProducts.name, `%${search}%`),
          ilike(cafeProducts.description || "", `%${search}%`)
        )
      );
    }
    if (categoryId) {
      conditions.push(eq(cafeProducts.categoryId, parseInt(categoryId)));
    }
    if (inStock === "true") {
      conditions.push(sql`${cafeProducts.stockQuantity} > 0`);
    }
    if (inStock === "low") {
      conditions.push(sql`${cafeProducts.stockQuantity} > 0 AND ${cafeProducts.stockQuantity} < 10`);
    }
    if (available === "true") {
      conditions.push(eq(cafeProducts.isAvailable, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const products = await db
      .select({
        id: cafeProducts.id,
        name: cafeProducts.name,
        categoryId: cafeProducts.categoryId,
        description: cafeProducts.description,
        price: cafeProducts.price,
        stockQuantity: cafeProducts.stockQuantity,
        isAvailable: cafeProducts.isAvailable,
        imageUrl: cafeProducts.imageUrl,
        createdAt: cafeProducts.createdAt,
        categoryName: cafeCategories.name,
      })
      .from(cafeProducts)
      .leftJoin(cafeCategories, eq(cafeProducts.categoryId, cafeCategories.id))
      .where(whereClause)
      .orderBy(cafeProducts.name)
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ total: count() })
      .from(cafeProducts)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: {
        items: products,
        total: totalResult[0]?.total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / pageSize),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await requireAuth();
    const allowedRoles: Role[] = ["admin", "cafe_staff"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const data = productSchema.parse({
      ...body,
      categoryId: body.categoryId ? Number(body.categoryId) : null,
      stockQuantity: body.stockQuantity ? Number(body.stockQuantity) : 0,
      price: body.price !== undefined ? String(body.price) : "0.00",
    });
    const [product] = await db
      .insert(cafeProducts)
      .values({
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        price: String(data.price),
        stockQuantity: data.stockQuantity,
        isAvailable: data.isAvailable,
        imageUrl: data.imageUrl,
      })
      .returning();
    return NextResponse.json({
      success: true,
      message: "Product created",
      data: product,
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
