import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookCategories, books } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { Role } from "@/types";

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const categories = await db
      .select({
        id: bookCategories.id,
        name: bookCategories.name,
        description: bookCategories.description,
        createdAt: bookCategories.createdAt,
        bookCount: count(books.id),
      })
      .from(bookCategories)
      .leftJoin(books, eq(books.categoryId, bookCategories.id))
      .groupBy(bookCategories.id)
      .orderBy(bookCategories.name);
    return NextResponse.json({ success: true, data: categories });
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
    const allowedRoles: Role[] = ["admin", "librarian"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = categorySchema.parse(body);
    const [cat] = await db
      .insert(bookCategories)
      .values(data)
      .returning();
    return NextResponse.json({
      success: true,
      message: "Category created",
      data: cat,
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
