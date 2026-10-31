import { NextResponse } from "next/server";
import { db } from "@/db";
import { fines, borrowings, books, users } from "@/db/schema";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

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
      conditions.push(eq(fines.userId, currentUser.id));
    }
    if (status) conditions.push(eq(fines.status, status as "pending" | "paid" | "waived"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: fines.id,
        userId: fines.userId,
        borrowingId: fines.borrowingId,
        amount: fines.amount,
        reason: fines.reason,
        status: fines.status,
        issuedDate: fines.issuedDate,
        paidDate: fines.paidDate,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
      })
      .from(fines)
      .innerJoin(borrowings, eq(fines.borrowingId, borrowings.id))
      .innerJoin(books, eq(borrowings.bookId, books.id))
      .innerJoin(users, eq(fines.userId, users.id))
      .where(whereClause)
      .orderBy(desc(fines.issuedDate))
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ total: count() })
      .from(fines)
      .where(whereClause);

    const unpaidWhere = [eq(fines.status, "pending")];
    if (currentUser.role === "member") {
      unpaidWhere.push(eq(fines.userId, currentUser.id));
    }
    const totalUnpaid = await db
      .select({ total: sum(fines.amount) })
      .from(fines)
      .where(and(...unpaidWhere));

    return NextResponse.json({
      success: true,
      data: {
        items: list,
        total: totalResult[0]?.total || 0,
        totalUnpaid: totalUnpaid[0]?.total || "0.00",
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
