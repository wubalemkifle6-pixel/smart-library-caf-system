import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const resId = parseInt(id);
    const [res] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, resId))
      .limit(1);
    if (!res) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }
    if (res.userId !== currentUser.id && !["admin", "librarian"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    await db
      .update(reservations)
      .set({ status: "cancelled" })
      .where(eq(reservations.id, resId));
    return NextResponse.json({
      success: true,
      message: "Reservation cancelled",
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
