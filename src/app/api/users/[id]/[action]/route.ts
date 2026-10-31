import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { UserStatus } from "@/types";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const currentUser = await requireAuth();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const { id, action } = await params;
    const userId = parseInt(id);
    let status: UserStatus;
    let title: string;
    let message: string;
    switch (action) {
      case "approve":
        status = "active";
        title = "Account Approved";
        message = "Your library membership has been approved. You can now log in and use all member services.";
        break;
      case "reject":
        status = "rejected";
        title = "Account Registration Rejected";
        message = "Your registration has been rejected. Please contact the library for more information.";
        break;
      case "activate":
        status = "active";
        title = "Account Activated";
        message = "Your account has been reactivated.";
        break;
      case "deactivate":
        status = "inactive";
        title = "Account Deactivated";
        message = "Your account has been deactivated. Please contact the library if you believe this is an error.";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 404 }
        );
    }
    await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Notify the user
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type: action === "reject" || action === "deactivate" ? "warning" : "success",
    });

    return NextResponse.json({
      success: true,
      message: `User ${action}d successfully`,
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
