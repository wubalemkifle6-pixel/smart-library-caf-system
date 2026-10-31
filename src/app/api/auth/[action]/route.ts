import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  hashPassword,
  comparePasswords,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getAuthUser,
  requireAuth,
  getDashboardPathByRole,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import type { Role, UserStatus } from "@/types";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  fullName: z.string().min(2).max(200),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  login: z.string().min(1), // username or email
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  username: z.string().min(3).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  try {
    await ensureSeeded();
    const { action } = await params;
    const body = await req.json().catch(() => ({}));

    if (action === "register") {
      const data = registerSchema.parse(body);
      // Check for existing user
      const existingEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      if (existingEmail.length > 0) {
        return NextResponse.json(
          { success: false, error: "Email already registered" },
          { status: 400 }
        );
      }
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, data.username))
        .limit(1);
      if (existingUsername.length > 0) {
        return NextResponse.json(
          { success: false, error: "Username already taken" },
          { status: 400 }
        );
      }
      const hashed = await hashPassword(data.password);
      const [newUser] = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          password: hashed,
          fullName: data.fullName,
          phone: data.phone,
          role: "member",
          status: "pending",
        })
        .returning();
      return NextResponse.json({
        success: true,
        message:
          "Registration submitted successfully. Please wait for administrator approval.",
        data: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    }

    if (action === "login") {
      const data = loginSchema.parse(body);
      // Try to find by username or email
      const [user] = await db
        .select()
        .from(users)
        .where(
          data.login.includes("@")
            ? eq(users.email, data.login)
            : eq(users.username, data.login)
        )
        .limit(1);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }
      const valid = await comparePasswords(data.password, user.password);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        );
      }
      if (user.status === "pending") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Your account is pending approval. You'll be able to login once an administrator approves your registration.",
          },
          { status: 403 }
        );
      }
      if (user.status === "rejected") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Your registration has been rejected. Please contact the library administrator.",
          },
          { status: 403 }
        );
      }
      if (user.status === "inactive") {
        return NextResponse.json(
          {
            success: false,
            error: "Your account has been deactivated. Please contact an administrator.",
          },
          { status: 403 }
        );
      }
      const token = await signToken({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role as Role,
        status: user.status as UserStatus,
      });
      await setAuthCookie(token);
      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
          },
          redirect: getDashboardPathByRole(user.role as Role),
        },
      });
    }

    if (action === "logout") {
      await clearAuthCookie();
      return NextResponse.json({ success: true, message: "Logged out" });
    }

    if (action === "me") {
      const user = await getAuthUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          redirect: getDashboardPathByRole(user.role),
        },
      });
    }

    if (action === "change-password") {
      const currentUser = await requireAuth();
      const data = changePasswordSchema.parse(body);
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUser.id))
        .limit(1);
      const valid = await comparePasswords(data.currentPassword, dbUser.password);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      const hashed = await hashPassword(data.newPassword);
      await db
        .update(users)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(users.id, currentUser.id));
      return NextResponse.json({
        success: true,
        message: "Password updated successfully",
      });
    }

    if (action === "forgot-password") {
      const data = forgotSchema.parse(body);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      // In production would send an email. For demo, just return generic success.
      return NextResponse.json({
        success: true,
        message:
          "If that email is registered, you will receive password reset instructions shortly.",
      });
    }

    if (action === "update-profile") {
      const currentUser = await requireAuth();
      const data = updateProfileSchema.parse(body);
      if (data.username && data.username !== currentUser.username) {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.username, data.username))
          .limit(1);
        if (existing.length > 0 && existing[0].id !== currentUser.id) {
          return NextResponse.json(
            { success: false, error: "Username already taken" },
            { status: 400 }
          );
        }
      }
      await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, currentUser.id));
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
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
    console.error(`Auth action error:`, error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 400 }
    );
  }
}
