
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  borrowings,
  books,
  users,
} from "@/db/schema";
import { eq, desc, and, count, sql, or } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { BorrowingStatus } from "@/types";
const borrowSchema = z.object({
  bookId: z.number().int().positive(),
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
    // Auto-update any borrowed records whose dueDate has passed to "overdue"
    await db
      .update(borrowings)
      .set({ status: "overdue", updatedAt: new Date() })
      .where(
        and(
          eq(borrowings.status, "borrowed"),
          sql`${borrowings.dueDate} IS NOT NULL AND ${borrowings.dueDate} < NOW()`
        )
      );
    const conditions = [];
    if (currentUser.role === "member") {
      conditions.push(eq(borrowings.userId, currentUser.id));
    }
    if (status === "active_borrowed") {
      conditions.push(
        or(
          eq(borrowings.status, "borrowed"),
          eq(borrowings.status, "overdue")
        )
      );
    } else if (status) {
      conditions.push(eq(borrowings.status, status as BorrowingStatus));
    }
    if (search) {
      conditions.push(
        or(
          sql`${books.title} ILIKE ${`%${search}%`}`,
          sql`${books.author} ILIKE ${`%${search}%`}`,
          sql`${users.fullName} ILIKE ${`%${search}%`}`,
          sql`${users.email} ILIKE ${`%${search}%`}`
        )
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const list = await db
      .select({
        id: borrowings.id,
        bookId: borrowings.bookId,
        userId: borrowings.userId,
        status: borrowings.status,
        requestDate: borrowings.requestDate,
        approvedDate: borrowings.approvedDate,
        borrowedDate: borrowings.borrowedDate,
        dueDate: borrowings.dueDate,
        returnedDate: borrowings.returnedDate,
        notes: borrowings.notes,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookCover: books.coverImage,
        bookIsbn: books.isbn,
        bookShelfLocation: books.shelfLocation,
        bookAvailableQuantity: books.availableQuantity,
        bookTotalQuantity: books.totalQuantity,
        userName: users.fullName,
        userEmail: users.email,
      })
      .from(borrowings)
      .innerJoin(books, eq(borrowings.bookId, books.id))
      .innerJoin(users, eq(borrowings.userId, users.id))
      .where(whereClause)
      .orderBy(desc(borrowings.createdAt))
      .limit(pageSize)
      .offset(offset);
    const totalResult = await db
      .select({ total: count() })
      .from(borrowings)
      .innerJoin(books, eq(borrowings.bookId, books.id))
      .innerJoin(users, eq(borrowings.userId, users.id))
      .where(whereClause);
    // Compute status counts for tab badges
    const memberScope =
      currentUser.role === "member" ? eq(borrowings.userId, currentUser.id) : undefined;
    const statusCountsRows = await db
      .select({
        status: borrowings.status,
        count: count(),
      })
      .from(borrowings)
      .where(memberScope)
      .groupBy(borrowings.status);
    const summary = {
      all: 0,
      pending: 0,
      approved: 0,
      borrowed: 0,
      overdue: 0,
      activeBorrowed: 0,
      returned: 0,
      rejected: 0,
    };
    for (const row of statusCountsRows) {
      const c = Number(row.count || 0);
      summary.all += c;
      if (row.status in summary) {
        (summary as Record<string, number>)[row.status] = c;
      }
    }
    summary.activeBorrowed = summary.borrowed + summary.overdue;
    return NextResponse.json({
      success: true,
      data: {
        items: list,
        total: totalResult[0]?.total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / pageSize),
        summary,
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
    if (currentUser.role !== "member") {
      return NextResponse.json(
        { success: false, error: "Only members can request to borrow books" },
        { status: 403 }
      );
    }
    if (currentUser.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Your account must be approved to borrow books" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = borrowSchema.parse({
      ...body,
      bookId: Number(body.bookId),
    });
    // Check book exists and is available
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, data.bookId))
      .limit(1);
    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }
    if (book.availableQuantity < 1) {
      return NextResponse.json(
        { success: false, error: "This book is currently unavailable. Please make a reservation instead." },
        { status: 400 }
      );
    }
    // Check if user already has pending/approved/borrowed/overdue for this book
    const existing = await db
      .select()
      .from(borrowings)
      .where(
        and(
          eq(borrowings.userId, currentUser.id),
          eq(borrowings.bookId, data.bookId),
          or(
            eq(borrowings.status, "pending"),
            eq(borrowings.status, "approved"),
            eq(borrowings.status, "borrowed"),
            eq(borrowings.status, "overdue")
          )
        )
      )
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "You already have an active request or borrow for this book." },
        { status: 400 }
      );
    }
    const [borrowing] = await db
      .insert(borrowings)
      .values({
        userId: currentUser.id,
        bookId: data.bookId,
        status: "pending",
        notes: data.notes,
      })
      .returning();
    return NextResponse.json({
      success: true,
      message: "Borrow request submitted. Please wait for librarian approval.",
      data: borrowing,
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