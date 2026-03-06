import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
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
  login: (
    email: string,
    password: string,
    requestedRole?: UserRole
  ) => Promise<UserRole>;
  signup: (
    name: string,
    email: string,
    password: string,
    requestedRole?: UserRole
  ) => Promise<void>;
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

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const isUserRole = (role: string): role is UserRole => {
    return role === "hr" || role === "manager" || role === "employee" || role === "site-head";
  };

  const syncUserRole = async (
    token: string,
    requestedRole?: UserRole
  ): Promise<UserRole | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sync-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          requestedRole ? { role: requestedRole } : {}
        ),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || "Role mismatch for this account.");
        }

        console.warn("Role sync failed with status", response.status);
        return null;
      }

      const data = await response.json();
      const role = String(data?.role || "").toLowerCase();

      return isUserRole(role) ? role : null;
    } catch (error) {
      console.warn("Role sync unavailable", error);
      return null;
    }
  };

  const login = async (
    email: string,
    password: string,
    requestedRole?: UserRole
  ): Promise<UserRole> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);

        const recaptcha = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
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
        if (error?.code === "auth/invalid-credential" || error?.code === "auth/invalid-login-credentials") {
          throw new Error("Invalid email or password.");
        }
        throw error;
      }
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Login failed");

    if (!firebaseUser.emailVerified) {
      try {
        await sendEmailVerification(firebaseUser);
      } catch (verificationError) {
        console.warn("Failed to send verification email", verificationError);
      }

      await auth.signOut();
      throw new Error("Email not verified. Verification link has been sent to your email.");
    }

    const token = await firebaseUser.getIdToken();
    console.log("🔥 Firebase token:", token);

    const role = await syncUserRole(token, requestedRole);

    const resolvedRole = role || "employee";

    setUser({
      name:
        firebaseUser.displayName ||
        email.split("@")[0],
      email,
      role: resolvedRole,
    });

    return resolvedRole;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    requestedRole?: UserRole
  ): Promise<void> => {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await updateProfile(userCredential.user, {
      displayName: name,
    });

    await sendEmailVerification(userCredential.user);

    const token =
      await userCredential.user.getIdToken();

    await syncUserRole(token, requestedRole);
    await auth.signOut();
    setUser(null);
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