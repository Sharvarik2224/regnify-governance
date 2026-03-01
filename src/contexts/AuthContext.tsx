import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type UserRole = "hr" | "manager" | "employee" | "site-head";

interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);

        const recaptcha = new RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" },
          auth
        );

        const phoneProvider = new PhoneAuthProvider(auth);

        const verificationId = await phoneProvider.verifyPhoneNumber(
          {
            multiFactorHint: resolver.hints[0],
            session: resolver.session,
          },
          recaptcha
        );

        const code = prompt("Enter OTP");
        if (!code) throw new Error("OTP required");

        const credential = PhoneAuthProvider.credential(
          verificationId,
          code
        );

        const multiFactorAssertion =
          PhoneMultiFactorGenerator.assertion(credential);

        await resolver.resolveSignIn(multiFactorAssertion);
      } else {
        throw error;
      }
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Login failed");

    const token = await firebaseUser.getIdToken();
    console.log("🔥 Firebase token:", token);

    // 🔥 Call backend to fetch role
    const response = await fetch(
      "http://localhost:5000/api/sync-user",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Backend authentication failed");
    }

    const data = await response.json();

    // 🔥 Use role from backend (DB)
    setUser({
      name:
        firebaseUser.displayName ||
        email.split("@")[0],
      email,
      role: data.role.toLowerCase(),
    });
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ) => {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await updateProfile(userCredential.user, {
      displayName: name,
    });

    const token =
      await userCredential.user.getIdToken();

    const response = await fetch(
      "http://localhost:5000/api/sync-user",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Backend authentication failed");
    }

    const data = await response.json();

    setUser({
      name,
      email,
      role: data.role.toLowerCase(),
    });
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};