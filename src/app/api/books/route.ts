import { NextResponse } from "next/server";
import { db } from "@/db";
import { books, bookCategories } from "@/db/schema";
import { eq, like, or, and, desc, sql, count } from "drizzle-orm";
import { z } from "zod";
import { getAuthUser, requireAuth } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import type { Role } from "@/types";

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  publicationYear: z.number().int().positive().optional().nullable(),
  publisher: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  totalQuantity: z.number().int().min(0).default(1),
  availableQuantity: z.number().int().min(0).optional(),
  shelfLocation: z.string().optional().nullable(),
  price: z.union([z.string(), z.number()]).optional().nullable(),
  isForBorrow: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const availability = searchParams.get("availability"); // available, unavailable
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.author, `%${search}%`),
          like(books.isbn || "", `%${search}%`)
        )
      );
    }
    if (categoryId) {
      conditions.push(eq(books.categoryId, parseInt(categoryId)));
    }
    if (availability === "available") {
      conditions.push(sql`${books.availableQuantity} > 0`);
    } else if (availability === "unavailable") {
      conditions.push(sql`${books.availableQuantity} = 0`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const bookList = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        isbn: books.isbn,
        categoryId: books.categoryId,
        publicationYear: books.publicationYear,
        publisher: books.publisher,
        description: books.description,
        coverImage: books.coverImage,
        totalQuantity: books.totalQuantity,
        availableQuantity: books.availableQuantity,
        shelfLocation: books.shelfLocation,
        price: books.price,
        isForBorrow: books.isForBorrow,
        createdAt: books.createdAt,
        categoryName: bookCategories.name,
      })
      .from(books)
      .leftJoin(bookCategories, eq(books.categoryId, bookCategories.id))
      .where(whereClause)
      .orderBy(desc(books.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ total: count() })
      .from(books)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: {
        items: bookList,
        total: totalResult[0]?.total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Get books error:", error);
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
    const data = bookSchema.parse({
      ...body,
      categoryId: body.categoryId ? Number(body.categoryId) : undefined,
      publicationYear: body.publicationYear
        ? Number(body.publicationYear)
        : undefined,
      totalQuantity: body.totalQuantity ? Number(body.totalQuantity) : 1,
    });
    const availableQty =
      data.availableQuantity !== undefined
        ? Number(data.availableQuantity)
        : data.totalQuantity;

    const [newBook] = await db
      .insert(books)
      .values({
        ...data,
        availableQuantity: availableQty,
        price: data.price ? String(data.price) : null,
      })
      .returning();
    return NextResponse.json({
      success: true,
      message: "Book added successfully",
      data: newBook,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    console.error("Create book error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
