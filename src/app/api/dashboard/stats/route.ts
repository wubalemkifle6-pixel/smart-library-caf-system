import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  books,
  borrowings,
  fines,
  cafeProducts,
  cafeOrders,
  payments,
} from "@/db/schema";
import {
  eq,
  count,
  sum,
  sql,
  and,
  gte,
  desc,
  lt,
  isNull,
  or,
} from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from "date-fns";

export async function GET() {
  try {
    const currentUser = await requireAuth();
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const fourteenDaysAgo = subDays(now, 14);

    if (currentUser.role === "admin") {
      const [totalUsers] = await db.select({ total: count() }).from(users);
      const [activeUsers] = await db
        .select({ total: count() })
        .from(users)
        .where(eq(users.status, "active"));
      const [pendingUsers] = await db
        .select({ total: count() })
        .from(users)
        .where(eq(users.status, "pending"));
      const [totalBooks] = await db.select({ total: count() }).from(books);
      const availResult = await db
        .select({ total: sum(books.availableQuantity) })
        .from(books);
      const totalQtyResult = await db
        .select({ total: sum(books.totalQuantity) })
        .from(books);
      const [borrowedBooks] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(
          or(eq(borrowings.status, "borrowed"), eq(borrowings.status, "overdue"))
        );
      const [overdueBooks] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(eq(borrowings.status, "overdue"));
      // Mark overdue books
      const overdueUpdates = await db
        .select()
        .from(borrowings)
        .where(
          and(
            eq(borrowings.status, "borrowed"),
            sql`${borrowings.dueDate} IS NOT NULL AND ${borrowings.dueDate} < NOW()`
          )
        );
      for (const ob of overdueUpdates) {
        await db
          .update(borrowings)
          .set({ status: "overdue" })
          .where(eq(borrowings.id, ob.id));
      }
      const [totalRevenue] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.status, "completed"));
      const [cafeRevenue] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.status, "completed"),
            sql`${payments.orderId} IS NOT NULL`
          )
        );
      const [totalOrders] = await db
        .select({ total: count() })
        .from(cafeOrders);
      const [lowStock] = await db
        .select({ total: count() })
        .from(cafeProducts)
        .where(sql`${cafeProducts.stockQuantity} < 10 AND ${cafeProducts.stockQuantity} > 0`);

      // Daily revenue for last 14 days (chart data)
      const dailyRevenue = await db
        .select({
          date: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM-DD')`,
          total: sum(payments.amount),
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, "completed"),
            gte(payments.createdAt, fourteenDaysAgo)
          )
        )
        .groupBy(sql`to_char(${payments.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM-DD')`);

      // Borrowings by category
      const borrowsByCategory = await db
        .select({
          categoryName: sql<string>`coalesce(${sql.raw('"bc"."name"')}, 'Uncategorized')`,
          count: count(borrowings.id),
        })
        .from(borrowings)
        .innerJoin(books, eq(borrowings.bookId, books.id))
        .leftJoin(
          sql.raw(`"book_categories" AS "bc"`),
          eq(books.categoryId, sql.raw('"bc"."id"'))
        )
        .groupBy(sql.raw('"bc"."name"'));

      return NextResponse.json({
        success: true,
        data: {
          totalUsers: totalUsers.total,
          activeUsers: activeUsers.total,
          pendingApprovals: pendingUsers.total,
          totalBooks: totalBooks.total,
          totalBookCopies: totalQtyResult[0]?.total || 0,
          availableBooks: availResult[0]?.total || 0,
          borrowedBooks: borrowedBooks.total,
          overdueBooks: overdueBooks.total + overdueUpdates.length,
          totalRevenue: totalRevenue.total || "0.00",
          cafeRevenue: cafeRevenue.total || "0.00",
          totalOrders: totalOrders.total,
          lowStockProducts: lowStock.total,
          dailyRevenue: dailyRevenue.map((d) => ({
            date: d.date,
            total: parseFloat(String(d.total || 0)),
          })),
          borrowsByCategory,
        },
      });
    }

    if (currentUser.role === "librarian") {
      const [totalBooks] = await db.select({ total: count() }).from(books);
      const availResult = await db
        .select({ total: sum(books.availableQuantity) })
        .from(books);
      const [pendingBorrows] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(eq(borrowings.status, "pending"));
      const [activeBorrows] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(
          or(eq(borrowings.status, "borrowed"), eq(borrowings.status, "overdue"))
        );
      const [overdueBorrows] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(eq(borrowings.status, "overdue"));
      const [totalMembers] = await db
        .select({ total: count() })
        .from(users)
        .where(
          and(eq(users.role, "member"), eq(users.status, "active"))
        );
      const recentBorrows = await db
        .select({
          id: borrowings.id,
          status: borrowings.status,
          requestDate: borrowings.requestDate,
          bookTitle: books.title,
          userName: users.fullName,
        })
        .from(borrowings)
        .innerJoin(books, eq(borrowings.bookId, books.id))
        .innerJoin(users, eq(borrowings.userId, users.id))
        .orderBy(desc(borrowings.createdAt))
        .limit(5);

      return NextResponse.json({
        success: true,
        data: {
          totalBooks: totalBooks.total,
          availableBooks: availResult[0]?.total || 0,
          pendingRequests: pendingBorrows.total,
          activeBorrowings: activeBorrows.total,
          overdueBooks: overdueBorrows.total,
          totalMembers: totalMembers.total,
          recentBorrows,
        },
      });
    }

    if (currentUser.role === "member") {
      const [myBorrowed] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(
          and(
            eq(borrowings.userId, currentUser.id),
            or(eq(borrowings.status, "borrowed"), eq(borrowings.status, "overdue"))
          )
        );
      const [pendingRequests] = await db
        .select({ total: count() })
        .from(borrowings)
        .where(
          and(
            eq(borrowings.userId, currentUser.id),
            eq(borrowings.status, "pending")
          )
        );
      const activeReservationsResult = await db
        .select({ total: count() })
        .from(sql`(SELECT 1 FROM reservations WHERE user_id = ${currentUser.id} AND status = 'active') AS r`);
      // Fines
      const [unpaidFines] = await db
        .select({ total: sum(fines.amount) })
        .from(fines)
        .where(
          and(
            eq(fines.userId, currentUser.id),
            eq(fines.status, "pending")
          )
        );
      const recentBorrows = await db
        .select({
          id: borrowings.id,
          status: borrowings.status,
          borrowedDate: borrowings.borrowedDate,
          dueDate: borrowings.dueDate,
          bookTitle: books.title,
          bookCover: books.coverImage,
        })
        .from(borrowings)
        .innerJoin(books, eq(borrowings.bookId, books.id))
        .where(eq(borrowings.userId, currentUser.id))
        .orderBy(desc(borrowings.createdAt))
        .limit(5);

      return NextResponse.json({
        success: true,
        data: {
          currentlyBorrowed: myBorrowed.total,
          pendingRequests: pendingRequests.total,
          activeReservations: Number(activeReservationsResult[0]?.total || 0),
          unpaidFines: unpaidFines.total || "0.00",
          recentBorrows,
        },
      });
    }

    if (currentUser.role === "cafe_staff") {
      const [pendingOrders] = await db
        .select({ total: count() })
        .from(cafeOrders)
        .where(eq(cafeOrders.status, "pending"));
      const [preparingOrders] = await db
        .select({ total: count() })
        .from(cafeOrders)
        .where(eq(cafeOrders.status, "preparing"));
      const [readyOrders] = await db
        .select({ total: count() })
        .from(cafeOrders)
        .where(eq(cafeOrders.status, "ready"));
      const [lowStock] = await db
        .select({ total: count() })
        .from(cafeProducts)
        .where(sql`${cafeProducts.stockQuantity} < 10`);
      const [outOfStock] = await db
        .select({ total: count() })
        .from(cafeProducts)
        .where(eq(cafeProducts.stockQuantity, 0));
      const [totalProducts] = await db
        .select({ total: count() })
        .from(cafeProducts);
      const recentOrders = await db
        .select()
        .from(cafeOrders)
        .orderBy(desc(cafeOrders.createdAt))
        .limit(5);

      return NextResponse.json({
        success: true,
        data: {
          pendingOrders: pendingOrders.total,
          preparingOrders: preparingOrders.total,
          readyOrders: readyOrders.total,
          lowStockProducts: lowStock.total,
          outOfStock: outOfStock.total,
          totalProducts: totalProducts.total,
          recentOrders,
        },
      });
    }

    if (currentUser.role === "cashier") {
      const [todaySales] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.status, "completed"),
            gte(payments.createdAt, today)
          )
        );
      const [todayOrders] = await db
        .select({ total: count() })
        .from(cafeOrders)
        .where(gte(cafeOrders.createdAt, today));
      const [pendingPayment] = await db
        .select({ total: count() })
        .from(cafeOrders)
        .where(eq(cafeOrders.status, "ready"));
      const [totalTodayTransactions] = await db
        .select({ total: count() })
        .from(payments)
        .where(gte(payments.createdAt, today));
      const recentPayments = await db
        .select({
          id: payments.id,
          amount: payments.amount,
          paymentMethod: payments.paymentMethod,
          status: payments.status,
          createdAt: payments.createdAt,
          orderNumber: cafeOrders.orderNumber,
        })
        .from(payments)
        .leftJoin(cafeOrders, eq(payments.orderId, cafeOrders.id))
        .orderBy(desc(payments.createdAt))
        .limit(5);

      // Sales per day (last 7 days)
      const weekSales = await db
        .select({
          date: sql<string>`to_char(${payments.createdAt}, 'Dy')`,
          total: sum(payments.amount),
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, "completed"),
            gte(payments.createdAt, subDays(now, 7))
          )
        )
        .groupBy(sql`to_char(${payments.createdAt}, 'Dy')`);

      return NextResponse.json({
        success: true,
        data: {
          todaySales: todaySales.total || "0.00",
          todayOrders: todayOrders.total,
          pendingPaymentCount: pendingPayment.total,
          todayTransactions: totalTodayTransactions.total,
          recentPayments,
          weekSales: weekSales.map((d) => ({
            date: d.date,
            total: parseFloat(String(d.total || 0)),
          })),
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
