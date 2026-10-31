import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  borrowings,
  books,
  notifications,
  fines,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import type { Role } from "@/types";
import { calculateFine } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id, action } = await params;
    const borrowingId = parseInt(id);
    const [borrowing] = await db
      .select()
      .from(borrowings)
      .where(eq(borrowings.id, borrowingId))
      .limit(1);
    if (!borrowing) {
      return NextResponse.json(
        { success: false, error: "Borrowing not found" },
        { status: 404 }
      );
    }
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, borrowing.bookId))
      .limit(1);

    const staffRoles: Role[] = ["admin", "librarian"];

    if (action === "approve") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (borrowing.status !== "pending") {
        return NextResponse.json(
          { success: false, error: `Cannot approve a ${borrowing.status} request` },
          { status: 400 }
        );
      }
      if (book.availableQuantity < 1) {
        return NextResponse.json(
          { success: false, error: "No copies available to issue" },
          { status: 400 }
        );
      }
      // Set as approved with due date 14 days from now, but don't decrement until borrowed/issued
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      await db
        .update(borrowings)
        .set({
          status: "approved",
          approvedDate: new Date(),
          approvedBy: currentUser.id,
          dueDate,
        })
        .where(eq(borrowings.id, borrowingId));
      await db.insert(notifications).values({
        userId: borrowing.userId,
        title: "Borrow Request Approved",
        message: `Your request for "${book.title}" has been approved. Please pick up your book within 48 hours. Due date: ${dueDate.toLocaleDateString()}.`,
        type: "success",
        link: "/dashboard/member/borrowed",
      });
      return NextResponse.json({
        success: true,
        message: "Borrow request approved",
      });
    }

    if (action === "reject") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      const body = await req.json().catch(() => ({}));
      await db
        .update(borrowings)
        .set({
          status: "rejected",
          notes: body.reason || borrowing.notes,
        })
        .where(eq(borrowings.id, borrowingId));
      await db.insert(notifications).values({
        userId: borrowing.userId,
        title: "Borrow Request Rejected",
        message: `Your request for "${book.title}" was rejected. ${body.reason ? "Reason: " + body.reason : ""}`,
        type: "warning",
      });
      return NextResponse.json({
        success: true,
        message: "Borrow request rejected",
      });
    }

    if (action === "issue") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (borrowing.status !== "approved" && borrowing.status !== "pending") {
        return NextResponse.json(
          { success: false, error: `Cannot issue a book that is ${borrowing.status}` },
          { status: 400 }
        );
      }
      if (book.availableQuantity < 1) {
        return NextResponse.json(
          { success: false, error: "No copies available" },
          { status: 400 }
        );
      }
      const borrowedDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      await db
        .update(borrowings)
        .set({
          status: "borrowed",
          borrowedDate,
          dueDate,
          approvedDate: borrowing.approvedDate || borrowedDate,
          approvedBy: currentUser.id,
        })
        .where(eq(borrowings.id, borrowingId));
      await db
        .update(books)
        .set({ availableQuantity: book.availableQuantity - 1 })
        .where(eq(books.id, book.id));
      await db.insert(notifications).values({
        userId: borrowing.userId,
        title: "Book Issued",
        message: `"${book.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString()}.`,
        type: "success",
        link: "/dashboard/member/borrowed",
      });
      return NextResponse.json({
        success: true,
        message: "Book issued successfully",
      });
    }

    if (action === "return") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (borrowing.status !== "borrowed" && borrowing.status !== "overdue") {
        return NextResponse.json(
          { success: false, error: `Cannot return a book that is ${borrowing.status}` },
          { status: 400 }
        );
      }
      const returnedDate = new Date();
      let fineAmount = 0;
      if (borrowing.dueDate && returnedDate > borrowing.dueDate) {
        fineAmount = calculateFine(borrowing.dueDate, returnedDate, 0.5);
      }
      await db
        .update(borrowings)
        .set({
          status: "returned",
          returnedDate,
        })
        .where(eq(borrowings.id, borrowingId));
      await db
        .update(books)
        .set({ availableQuantity: book.availableQuantity + 1 })
        .where(eq(books.id, book.id));

      // Create fine if late
      if (fineAmount > 0) {
        await db.insert(fines).values({
          userId: borrowing.userId,
          borrowingId: borrowing.id,
          amount: String(fineAmount.toFixed(2)),
          reason: `Overdue return (${book.title}) - $0.50 per day`,
          status: "pending",
        });
        await db.insert(notifications).values({
          userId: borrowing.userId,
          title: "Late Return Fine Issued",
          message: `You have been fined $${fineAmount.toFixed(2)} for the late return of "${book.title}".`,
          type: "warning",
          link: "/dashboard/member/fines",
        });
      } else {
        await db.insert(notifications).values({
          userId: borrowing.userId,
          title: "Book Returned",
          message: `"${book.title}" has been returned successfully. Thank you!`,
          type: "success",
        });
      }
      return NextResponse.json({
        success: true,
        message:
          fineAmount > 0
            ? `Book returned. Fine of $${fineAmount.toFixed(2)} issued.`
            : "Book returned successfully",
        data: { fineAmount },
      });
    }

    // Member cancels their own pending request
    if (action === "cancel") {
      if (
        borrowing.userId !== currentUser.id &&
        !staffRoles.includes(currentUser.role)
      ) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      if (borrowing.status !== "pending") {
        return NextResponse.json(
          { success: false, error: "Only pending requests can be cancelled" },
          { status: 400 }
        );
      }
      // Actually we'll just delete or reject; set to rejected for record
      await db
        .update(borrowings)
        .set({ status: "rejected", notes: "Cancelled by user" })
        .where(eq(borrowings.id, borrowingId));
      return NextResponse.json({
        success: true,
        message: "Request cancelled",
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 404 }
    );
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
