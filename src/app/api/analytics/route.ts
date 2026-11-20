
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// CORS headers for the SQL Analysis dashboard
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle browser preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const [
      overview,
      bookCategories,
      borrowingStatuses,
      topBooks,
      monthlyBorrowings,
      cafeSales,
      topCafeProducts,
      fineAnalytics,
    ] = await Promise.all([
      // 1. Main statistics
      db.execute(sql`
        SELECT
          (SELECT COUNT(*) FROM books) AS total_books,
          (SELECT COUNT(*) FROM users WHERE role = 'member') AS total_members,
          (SELECT COUNT(*) FROM borrowings) AS total_borrowings,
          (SELECT COUNT(*) FROM borrowings
            WHERE status = 'borrowed') AS currently_borrowed,
          (SELECT COUNT(*) FROM borrowings
            WHERE status = 'overdue') AS overdue_borrowings,
          (SELECT COUNT(*) FROM cafe_orders) AS total_cafe_orders
      `),

      // 2. Books by category
      db.execute(sql`
        SELECT
          bc.name AS category,
          COUNT(b.id) AS total_books
        FROM book_categories bc
        LEFT JOIN books b ON b.category_id = bc.id
        GROUP BY bc.id, bc.name
        ORDER BY total_books DESC
      `),

      // 3. Borrowing status
      db.execute(sql`
        SELECT
          status,
          COUNT(*) AS total
        FROM borrowings
        GROUP BY status
        ORDER BY total DESC
      `),

      // 4. Most borrowed books
      db.execute(sql`
        SELECT
          b.title,
          COUNT(br.id) AS total_borrowings
        FROM books b
        LEFT JOIN borrowings br ON br.book_id = b.id
        GROUP BY b.id, b.title
        ORDER BY total_borrowings DESC
        LIMIT 10
      `),

      // 5. Monthly borrowing activity
      db.execute(sql`
        SELECT
          TO_CHAR(
            DATE_TRUNC('month', request_date),
            'YYYY-MM'
          ) AS month,
          COUNT(*) AS total_borrowings
        FROM borrowings
        GROUP BY DATE_TRUNC('month', request_date)
        ORDER BY DATE_TRUNC('month', request_date)
      `),

      // 6. Café sales
      db.execute(sql`
        SELECT
          COUNT(*) AS total_orders,
          COALESCE(SUM(total), 0) AS total_revenue
        FROM cafe_orders
        WHERE status = 'completed'
      `),

      // 7. Best-selling café products
      db.execute(sql`
        SELECT
          product_name,
          SUM(quantity) AS total_quantity,
          SUM(subtotal) AS total_sales
        FROM cafe_order_items
        GROUP BY product_name
        ORDER BY total_quantity DESC
        LIMIT 10
      `),

      // 8. Fine analytics
      db.execute(sql`
        SELECT
          COUNT(*) AS total_fines,
          COALESCE(SUM(amount), 0) AS total_fine_amount,
          COALESCE(
            SUM(amount) FILTER (WHERE status = 'paid'),
            0
          ) AS paid_fines,
          COALESCE(
            SUM(amount) FILTER (WHERE status = 'pending'),
            0
          ) AS unpaid_fines
        FROM fines
      `),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: overview.rows[0],
          bookCategories: bookCategories.rows,
          borrowingStatuses: borrowingStatuses.rows,
          topBooks: topBooks.rows,
          monthlyBorrowings: monthlyBorrowings.rows,
          cafeSales: cafeSales.rows[0],
          topCafeProducts: topCafeProducts.rows,
          fineAnalytics: fineAnalytics.rows[0],
        },
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load analytics data",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
