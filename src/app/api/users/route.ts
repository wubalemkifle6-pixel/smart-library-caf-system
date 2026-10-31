import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, like, or, and, desc, count, ilike } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, hashPassword } from "@/lib/auth";
import type { Role, UserStatus } from "@/types";

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["admin", "librarian", "member", "cafe_staff", "cashier"]),
  status: z.enum(["pending", "active", "rejected", "inactive"]).default("active"),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const offset = (page - 1) * pageSize;

    // Members can only view their own profile; handle that via /api/users/me elsewhere
    if (currentUser.role === "member") {
      return NextResponse.json(
        { success: false, error: "Members cannot list all users" },
        { status: 403 }
      );
    }

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.fullName, `%${search}%`),
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    if (role) conditions.push(eq(users.role, role as Role));
    if (status) conditions.push(eq(users.status, status as UserStatus));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const userList = await db
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
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalResult = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: {
        items: userList,
        total: totalResult[0]?.total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalResult[0]?.total || 0) / pageSize),
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

export async function POST(req: Request) {
  try {
    const currentUser = await requireAuth();
    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only administrators can create users" },
        { status: 403 }
      );
    }
    const body = await req.json();
    const data = createUserSchema.parse(body);
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
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
        ...data,
        password: hashed,
      })
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
      message: "User created successfully",
      data: newUser,
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
