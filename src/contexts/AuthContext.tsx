import React, { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export type UserRole = "hr" | "manager" | "employee" | "site-head";

interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  signup: (name: string, email: string, password: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("regnify_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, _password: string, role: UserRole) => {
    const u = { name: email.split("@")[0], email, role };
    setUser(u);
    localStorage.setItem("regnify_user", JSON.stringify(u));
  };

  const signup = (name: string, email: string, _password: string, role: UserRole) => {
    const u = { name, email, role };
    setUser(u);
    localStorage.setItem("regnify_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("regnify_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
