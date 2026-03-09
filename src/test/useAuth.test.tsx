import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  auth: { name: "test-auth" },
  googleProvider: { providerId: "google.com" },
  getRedirectResultMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signInWithRedirectMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getRedirectResult: authMocks.getRedirectResultMock,
  onAuthStateChanged: authMocks.onAuthStateChangedMock,
  signInWithPopup: authMocks.signInWithPopupMock,
  signInWithRedirect: authMocks.signInWithRedirectMock,
  signOut: authMocks.signOutMock,
}));

vi.mock("@/lib/firebase", () => ({
  auth: authMocks.auth,
  googleProvider: authMocks.googleProvider,
}));

import { AuthProvider, useAuth } from "@/hooks/useAuth";

const TestConsumer = () => {
  const { loading, loginWithGoogle } = useAuth();

  return (
    <div>
      <div>{loading ? "loading" : "ready"}</div>
      <button type="button" onClick={loginWithGoogle}>Sign in</button>
    </div>
  );
};

describe("useAuth", () => {
  beforeEach(() => {
    authMocks.onAuthStateChangedMock.mockReset();
    authMocks.getRedirectResultMock.mockReset();
    authMocks.signInWithPopupMock.mockReset();
    authMocks.signInWithRedirectMock.mockReset();
    authMocks.signOutMock.mockReset();

    authMocks.onAuthStateChangedMock.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
      callback(null);
      return vi.fn();
    });
    authMocks.getRedirectResultMock.mockResolvedValue(null);
    authMocks.signInWithPopupMock.mockResolvedValue(undefined);
    authMocks.signInWithRedirectMock.mockResolvedValue(undefined);
    authMocks.signOutMock.mockResolvedValue(undefined);
  });

  it("uses popup-based Google sign-in when available", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText("ready")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(authMocks.signInWithPopupMock).toHaveBeenCalledWith(authMocks.auth, authMocks.googleProvider);
      expect(authMocks.signInWithRedirectMock).not.toHaveBeenCalled();
    });
  });

  it("falls back to redirect sign-in when popup auth is blocked", async () => {
    authMocks.signInWithPopupMock.mockRejectedValueOnce({ code: "auth/popup-blocked" });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText("ready")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(authMocks.signInWithPopupMock).toHaveBeenCalledWith(authMocks.auth, authMocks.googleProvider);
      expect(authMocks.signInWithRedirectMock).toHaveBeenCalledWith(authMocks.auth, authMocks.googleProvider);
    });
  });

  it("shows an error when Google sign-in is not allowed for the current domain", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    authMocks.signInWithPopupMock.mockRejectedValueOnce({ code: "auth/unauthorized-domain" });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText("ready")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith("Login failed because this site domain is not authorized in Firebase Auth.");
    });
  });
});