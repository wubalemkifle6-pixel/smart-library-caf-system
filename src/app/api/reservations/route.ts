import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, books, users } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import type { Role, ReservationStatus } from "@/types";

const reservationSchema = z.object({
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
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (currentUser.role === "member") {
      conditions.push(eq(reservations.userId, currentUser.id));
    }
    if (status) {
      conditions.push(eq(reservations.status, status as ReservationStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: reservations.id,
        bookId: reservations.bookId,
        userId: reservations.userId,
        status: reservations.status,
        reservationDate: reservations.reservationDate,
        expiryDate: reservations.expiryDate,
        notes: reservations.notes,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookCover: books.coverImage,
        userName: users.fullName,
      })
      .from(reservations)
      .innerJoin(books, eq(reservations.bookId, books.id))
      .innerJoin(users, eq(reservations.userId, users.id))
      .where(whereClause)
      .orderBy(desc(reservations.reservationDate))
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ total: count() })
      .from(reservations)
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
    if (currentUser.role !== "member") {
      return NextResponse.json(
        { success: false, error: "Only members can make reservations" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = reservationSchema.parse({
      ...body,
      bookId: Number(body.bookId),
    });
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
    const existing = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.userId, currentUser.id),
          eq(reservations.bookId, data.bookId),
          eq(reservations.status, "active")
        )
      )
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "You already have an active reservation for this book" },
        { status: 400 }
      );
    }
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const [res] = await db
      .insert(reservations)
      .values({
        userId: currentUser.id,
        bookId: data.bookId,
        expiryDate: expiry,
        notes: data.notes,
      })
      .returning();
    return NextResponse.json({
      success: true,
      message: `Book reserved successfully. You'll be notified when it becomes available. Expires ${expiry.toLocaleDateString()}.`,
      data: res,
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
