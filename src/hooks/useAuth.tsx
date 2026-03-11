import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";

import { auth, googleProvider } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REDIRECT_FALLBACK_ERROR_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
]);

const getFirebaseAuthErrorCode = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: string }).code || "");
  }

  return "";
};

const getGoogleLoginErrorMessage = (error: unknown) => {
  const code = getFirebaseAuthErrorCode(error);

  if (code === "auth/unauthorized-domain") {
    const domain = typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "this domain";
    return `Login failed because ${domain} is not authorized in Firebase Auth. Add it in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }

  if (code === "auth/operation-not-allowed") {
    return "Login failed because Google sign-in is not enabled in Firebase Auth.";
  }

  return "Login failed. Please check that Google sign-in is enabled in your Firebase project.";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authStateResolved = false;
    let redirectResultResolved = false;

    const finishLoadingIfReady = () => {
      if (isMounted && authStateResolved && redirectResultResolved) {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) {
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }

      authStateResolved = true;
      finishLoadingIfReady();
    });

    getRedirectResult(auth)
      .catch((error) => {
        console.error("[Firebase Auth] Google redirect login failed", error);
        alert(getGoogleLoginErrorMessage(error));
      })
      .finally(() => {
        redirectResultResolved = true;
        finishLoadingIfReady();
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      setLoading(false);
      return;
    } catch (error) {
      const errorCode = getFirebaseAuthErrorCode(error);
      if (REDIRECT_FALLBACK_ERROR_CODES.has(errorCode)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("[Firebase Auth] Google redirect login failed", redirectError);
          alert(getGoogleLoginErrorMessage(redirectError));
          setLoading(false);
          return;
        }
      }

      console.error("[Firebase Auth] Google login failed", error);
      alert(getGoogleLoginErrorMessage(error));
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Clear any local storage data
      localStorage.removeItem('farm-companion-profile');
      localStorage.removeItem('farm-companion-language');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
