import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: "user" | "admin";
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): User | null {
  try {
    const raw = localStorage.getItem("app-user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser());

  useEffect(() => {
    try {
      if (user) localStorage.setItem("app-user", JSON.stringify(user));
      else localStorage.removeItem("app-user");
    } catch {}
  }, [user]);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setUser(data.user);
    try {
      localStorage.setItem("app-token", data.token);
    } catch {}
    window.location.hash = "problems-home";
  }

  async function register(name: string, email: string, password: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) throw new Error("Registration failed");
    const data = await res.json();
    setUser(data.user);
    try {
      localStorage.setItem("app-token", data.token);
    } catch {}
    window.location.hash = "problems-home";
  }

  function logout() {
    setUser(null);
    try {
      localStorage.removeItem("app-token");
    } catch {}
    window.location.hash = "auth";
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, register, logout }),
    [user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
