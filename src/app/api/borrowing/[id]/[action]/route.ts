import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  borrowings,
  books,
  notifications,
  fines,
  reservations,
} from "@/db/schema";
import { eq, and, asc, count, inArray } from "drizzle-orm";
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
    if (isNaN(borrowingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid borrowing ID" },
        { status: 400 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const staffRoles: Role[] = ["admin", "librarian"];
    // 1. APPROVE BORROWING REQUEST
    if (action === "approve") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      const result = await db.transaction(async (tx) => {
        const [borrowing] = await tx
          .select()
          .from(borrowings)
          .where(eq(borrowings.id, borrowingId))
          .limit(1);
        if (!borrowing) {
          throw new Error("NOT_FOUND:Borrowing request not found");
        }
        if (borrowing.status !== "pending") {
          throw new Error(
            `BAD_REQUEST:Cannot approve a request with status "${borrowing.status}". Only pending requests can be approved.`
          );
        }
        const [book] = await tx
          .select()
          .from(books)
          .where(eq(books.id, borrowing.bookId))
          .limit(1)
          .for("update");
        // Derive availability from the actual active loans (row-locked),
        // so the stored counter can never drift or double-count copies.
        const [{ n: activeLoans }] = await tx
          .select({ n: count() })
          .from(borrowings)
          .where(
            and(
              eq(borrowings.bookId, book.id),
              inArray(borrowings.status, ["borrowed", "overdue"])
            )
          );
        const effectiveAvailable = book.totalQuantity - Number(activeLoans);
        if (effectiveAvailable < 1) {
          throw new ActionError("No copies available");
        }
        const borrowedDate = new Date();
        const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);}
        const [updatedBorrowing] = await tx
          .update(borrowings)
          .set({
            status: "approved",
            borrowedDate,
            approvedDate,
            approvedBy: currentUser.id,
            dueDate,
            notes: body.notes !== undefined ? body.notes : borrowing.notes,
            updatedAt: new Date(),
          })
          .where(eq(borrowings.id, borrowingId))
          .returning();
        await tx.insert(notifications).values({
          userId: borrowing.userId,
          title: "Borrow Request Approved",
          message: `Your request for "${book.title}" has been approved. Please pick up your book at the library desk within 48 hours.`,
          type: "success",
          link: "/dashboard/member/borrowed",
        });
        return { updatedBorrowing, book };
      });
      return NextResponse.json({
        success: true,
        message: `Borrow request for "${result.book.title}" approved. Ready to be physically issued to the member.`,
        data: result.updatedBorrowing,
      });
    }
    // 2. REJECT BORROWING REQUEST
    if (action === "reject") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      const result = await db.transaction(async (tx) => {
        const [borrowing] = await tx
          .select()
          .from(borrowings)
          .where(eq(borrowings.id, borrowingId))
          .limit(1);
        if (!borrowing) {
          throw new Error("NOT_FOUND:Borrowing request not found");
        }
        if (borrowing.status !== "pending" && borrowing.status !== "approved") {
          throw new Error(
            `BAD_REQUEST:Cannot reject a borrowing record with status "${borrowing.status}".`
          );
        }
        const [book] = await tx
          .select()
          .from(books)
          .where(eq(books.id, borrowing.bookId))
          .limit(1);
        const [updatedBorrowing] = await tx
          .update(borrowings)
          .set({
            status: "rejected",
            notes: body.reason || body.notes || borrowing.notes || "Rejected by librarian",
            updatedAt: new Date(),
          })
          .where(eq(borrowings.id, borrowingId))
          .returning();
        await tx.insert(notifications).values({
          userId: borrowing.userId,
          title: "Borrow Request Rejected",
          message: `Your request for "${book?.title || "book"}" was rejected.${body.reason ? " Reason: " + body.reason : ""}`,
          type: "warning",
        });
        return updatedBorrowing;
      });
      return NextResponse.json({
        success: true,
        message: "Borrow request rejected",
        data: result,
      });
    }
    // 3. ISSUE BOOK TO MEMBER (Physical Handover)
    if (action === "issue") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      const result = await db.transaction(async (tx) => {
        const [borrowing] = await tx
          .select()
          .from(borrowings)
          .where(eq(borrowings.id, borrowingId))
          .limit(1);
        if (!borrowing) {
          throw new Error("NOT_FOUND:Borrowing record not found");
        }
        if (borrowing.status !== "approved" && borrowing.status !== "pending") {
          throw new Error(
            `BAD_REQUEST:Cannot issue a book with status "${borrowing.status}". Only approved or pending requests can be issued.`
          );
        }
        const [book] = await tx
          .select()
          .from(books)
          .where(eq(books.id, borrowing.bookId))
          .limit(1);
        if (!book) {
          throw new Error("NOT_FOUND:Book not found");
        }
        if (book.availableQuantity < 1) {
          throw new Error(
            `BAD_REQUEST:No copies of "${book.title}" are currently available to issue.`
          );
        }
        const borrowedDate = body.borrowedDate
          ? new Date(body.borrowedDate)
          : new Date();
        let dueDate: Date;
        if (body.dueDate) {
          dueDate = new Date(body.dueDate);
          if (isNaN(dueDate.getTime()) || dueDate <= borrowedDate) {
            dueDate = new Date(borrowedDate);
            dueDate.setDate(dueDate.getDate() + 14);
          }
        } else {
          dueDate = new Date(borrowedDate);
          dueDate.setDate(dueDate.getDate() + 14);
        }
        const [updatedBorrowing] = await tx
          .update(borrowings)
          .set({
            status: "borrowed",
            borrowedDate,
            dueDate,
            approvedDate: borrowing.approvedDate || borrowedDate,
            approvedBy: currentUser.id,
            notes: body.notes !== undefined ? body.notes : borrowing.notes,
            updatedAt: new Date(),
          })
          .where(eq(borrowings.id, borrowingId))
          .returning();
        await tx
  .update(books)
  .set({
    availableQuantity: nextAvailableQty,
    updatedAt: new Date(),
  })
  .where(eq(books.id, book.id));
        await tx.insert(notifications).values({
          userId: borrowing.userId,
          title: "Book Issued",
          message: `"${book.title}" has been physically issued to you on ${borrowedDate.toLocaleDateString()}. Expected return due date: ${dueDate.toLocaleDateString()}.`,
          type: "success",
          link: "/dashboard/member/borrowed",
        });
        return { updatedBorrowing, book, dueDate };
      });
      return NextResponse.json({
        success: true,
        message: `"${result.book.title}" issued successfully. Due date: ${result.dueDate.toLocaleDateString()}.`,
        data: result.updatedBorrowing,
      });
    }
    // 4. RETURN BOOK
    if (action === "return") {
      if (!staffRoles.includes(currentUser.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
      const result = await db.transaction(async (tx) => {
        const [borrowing] = await tx
          .select()
          .from(borrowings)
          .where(eq(borrowings.id, borrowingId))
          .limit(1);
        if (!borrowing) {
          throw new Error("NOT_FOUND:Borrowing record not found");
        }
        // Prevent duplicate returns
        if (borrowing.status === "returned" || borrowing.returnedDate !== null) {
          throw new Error("BAD_REQUEST:This book has already been returned.");
        }
        // Prevent returning pending, rejected, or unissued (approved) requests
        if (borrowing.status !== "borrowed" && borrowing.status !== "overdue") {
          throw new Error(
            `BAD_REQUEST:Cannot return a borrowing request with status "${borrowing.status}". Only physically issued (borrowed or overdue) books can be returned.`
          );
        }
       const [book] = await tx
          .select()
          .from(books)
          .where(eq(books.id, borrowing.bookId))
          .limit(1)
          .for("update");
        // Count active loans under the lock (includes this one), then derive
        // availability from real transactions — self-healing, no double count.
        const [{ n: activeLoans }] = await tx
          .select({ n: count() })
          .from(borrowings)
          .where(
            and(
              eq(borrowings.bookId, book.id),
              inArray(borrowings.status, ["borrowed", "overdue"])
            )
          );
        const returnedDate = new Date();
        if (borrowing.dueDate && returnedDate > borrowing.dueDate) {
          fineAmount = calculateFine(borrowing.dueDate, returnedDate, 0.5);
        }
        // Status + actual return date + availability + fine change together.
        await tx
          .update(borrowings)
          .set({ status: "returned", returnedDate, updatedAt: new Date() })
          .where(eq(borrowings.id, borrowingId));
        await tx
          .update(books)
          .set({
            availableQuantity: book.totalQuantity - (Number(activeLoans) - 1),
            updatedAt: new Date(),
          })
          .where(eq(books.id, book.id));
        await tx
          .update(books)
          .set({
            availableQuantity: nextAvailableQty,
            updatedAt: new Date(),
          })
          .where(eq(books.id, book.id));
        // Check if there is an active reservation waiting for this book
        const [nextReservation] = await tx
          .select()
          .from(reservations)
          .where(
            and(
              eq(reservations.bookId, book.id),
              eq(reservations.status, "active")
            )
          )
          .orderBy(asc(reservations.reservationDate))
          .limit(1);
        if (nextReservation) {
          await tx.insert(notifications).values({
            userId: nextReservation.userId,
            title: "Reserved Book Now Available",
            message: `Good news! A copy of "${book.title}" you reserved has been returned and is now available to borrow.`,
            type: "info",
            link: "/dashboard/member/reservations",
          });
        }
        // Create fine if overdue
        if (fineAmount > 0) {
          await tx.insert(fines).values({
            userId: borrowing.userId,
            borrowingId: borrowing.id,
            amount: String(fineAmount.toFixed(2)),
            reason: `Overdue return (${book.title}) - $0.50 per day`,
            status: "pending",
          });
          await tx.insert(notifications).values({
            userId: borrowing.userId,
            title: "Late Return Fine Issued",
            message: `You have been fined $${fineAmount.toFixed(2)} for the late return of "${book.title}".`,
            type: "warning",
            link: "/dashboard/member/fines",
          });
        } else {
          await tx.insert(notifications).values({
            userId: borrowing.userId,
            title: "Book Returned",
            message: `"${book.title}" has been returned on ${returnedDate.toLocaleDateString()}. Thank you!`,
            type: "success",
          });
        }
        return { fineAmount, updatedBorrowing, book };
      });
      return NextResponse.json({
        success: true,
        message:
          result.fineAmount > 0
            ? `Book returned. Overdue fine of $${result.fineAmount.toFixed(2)} issued.`
            : `"${result.book.title}" returned successfully.`,
        data: {
          fineAmount: result.fineAmount,
          borrowing: result.updatedBorrowing,
        },
      });
    }
    // 5. CANCEL PENDING REQUEST (Member or Staff)
    if (action === "cancel") {
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
      await db
        .update(borrowings)
        .set({
          status: "rejected",
          notes: "Cancelled by user",
          updatedAt: new Date(),
        })
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
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message.startsWith("NOT_FOUND:")) {
        return NextResponse.json(
          { success: false, error: error.message.replace("NOT_FOUND:", "") },
          { status: 404 }
        );
      }
      if (error.message.startsWith("BAD_REQUEST:")) {
        return NextResponse.json(
          { success: false, error: error.message.replace("BAD_REQUEST:", "") },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
