import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    const conditions = [eq(notifications.userId, currentUser.id)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    const list = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    const unreadCountResult = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, currentUser.id), eq(notifications.isRead, false)));

    const totalResult = await db
      .select({ total: count() })
      .from(notifications)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: {
        items: list,
        unreadCount: unreadCountResult[0]?.count || 0,
        total: totalResult[0]?.total || 0,
        page,
        pageSize,
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
