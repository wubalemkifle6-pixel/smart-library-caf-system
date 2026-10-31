import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    if (id === "all") {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, currentUser.id));
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }
    const notifId = parseInt(id);
    const [notif] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notifId))
      .limit(1);
    if (!notif) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    if (notif.userId !== currentUser.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notifId));
    return NextResponse.json({ success: true });
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
