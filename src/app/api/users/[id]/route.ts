import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, hashPassword } from "@/lib/auth";
import type { Role, UserStatus } from "@/types";

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["admin", "librarian", "member", "cafe_staff", "cashier"]).optional(),
  status: z.enum(["pending", "active", "rejected", "inactive"]).optional(),
  address: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const userId = parseInt(id);
    // Users can view their own profile; admins/librarians can view any
    if (currentUser.id !== userId && !["admin", "librarian"].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role,
        status: users.status,
        address: users.address,
        bio: users.bio,
        profileImage: users.profileImage,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: user });
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;
    const userId = parseInt(id);
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    // Regular users can only update their own profile and limited fields
    if (currentUser.id === userId && currentUser.role !== "admin") {
      const allowed = ["fullName", "phone", "address", "bio", "username", "password"];
      for (const key of Object.keys(data)) {
        if (!allowed.includes(key)) {
          return NextResponse.json(
            { success: false, error: `You cannot update field: ${key}` },
            { status: 403 }
          );
        }
      }
    } else if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only administrators can update other users" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.role !== undefined && currentUser.role === "admin")
      updateData.role = data.role;
    if (data.status !== undefined && currentUser.role === "admin")
      updateData.status = data.status;
    if (data.password) updateData.password = await hashPassword(data.password);

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
      });
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: updated,
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only administrators can delete users" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const userId = parseInt(id);
    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }
    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
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
