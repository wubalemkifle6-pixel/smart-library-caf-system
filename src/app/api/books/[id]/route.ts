import { NextResponse } from "next/server";
import { db } from "@/db";
import { books, bookCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { Role } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [book] = await db
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
        updatedAt: books.updatedAt,
        categoryName: bookCategories.name,
      })
      .from(books)
      .leftJoin(bookCategories, eq(books.categoryId, bookCategories.id))
      .where(eq(books.id, parseInt(id)))
      .limit(1);
    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: book });
  } catch (error) {
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
    const allowedRoles: Role[] = ["admin", "librarian"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title",
      "author",
      "isbn",
      "publicationYear",
      "publisher",
      "description",
      "coverImage",
      "totalQuantity",
      "availableQuantity",
      "shelfLocation",
      "price",
      "isForBorrow",
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] =
          field === "price" && body[field] !== null
            ? String(body[field])
            : body[field];
      }
    }
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId
        ? Number(body.categoryId)
        : null;
    }
    if (body.publicationYear !== undefined) {
      updateData.publicationYear = body.publicationYear
        ? Number(body.publicationYear)
        : null;
    }
    if (body.totalQuantity !== undefined) {
      updateData.totalQuantity = Number(body.totalQuantity);
    }
    if (body.availableQuantity !== undefined) {
      updateData.availableQuantity = Number(body.availableQuantity);
    }
    updateData.updatedAt = new Date();
    const [updated] = await db
      .update(books)
      .set(updateData)
      .where(eq(books.id, parseInt(id)))
      .returning();
    return NextResponse.json({
      success: true,
      message: "Book updated successfully",
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
    const allowedRoles: Role[] = ["admin"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Only administrators can delete books" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await db.delete(books).where(eq(books.id, parseInt(id)));
    return NextResponse.json({
      success: true,
      message: "Book deleted successfully",
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
