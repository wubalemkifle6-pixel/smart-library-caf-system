"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Role, UserStatus, ApiResponse } from "@/types";

export interface AuthUserInfo {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  redirect?: string;
  phone?: string | null;
}

interface AuthContextType {
  user: AuthUserInfo | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ success: boolean; message?: string; redirect?: string }>;
  logout: () => Promise<void>;
  register: (data: { username: string; email: string; password: string; fullName: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  return res.json();
}

export default function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<AuthUserInfo>("/api/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (loginInput: string, password: string) => {
    const res = await apiFetch<{ user: AuthUserInfo; redirect: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: loginInput, password }),
    });
    if (res.success && res.data) {
      setUser(res.data.user);
      return { success: true, redirect: res.data.redirect };
    }
    return { success: false, message: res.error || "Login failed" };
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.success) {
      return { success: true, message: res.message };
    }
    return { success: false, message: res.error || "Registration failed" };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
