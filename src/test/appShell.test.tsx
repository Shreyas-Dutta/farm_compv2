import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { uid: "test-user" } as { uid: string } | null,
  loading: false,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/pages/Index", () => ({ default: () => <div>Home page</div> }));
vi.mock("@/pages/News", () => ({ default: () => <div>News page</div> }));
vi.mock("@/pages/Market", () => ({ default: () => <div>Market page</div> }));
vi.mock("@/pages/Scan", () => ({ default: () => <div>Scan page</div> }));
vi.mock("@/pages/Weather", () => ({ default: () => <div>Weather page</div> }));
vi.mock("@/pages/Profile", () => ({ default: () => <div>Profile page</div> }));
vi.mock("@/pages/ProfileSetup-Fixed", () => ({ default: () => <div>Profile setup page</div> }));
vi.mock("@/pages/AddCrop", () => ({ default: () => <div>Add crop page</div> }));
vi.mock("@/pages/Login", () => ({ default: () => <div>Login page</div> }));
vi.mock("@/components/BottomNav", () => ({ default: () => <div>Bottom nav</div> }));

import App from "@/App";

describe("App shell", () => {
  beforeEach(() => {
    authState.user = { uid: "test-user" };
    authState.loading = false;
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("renders the public login route", () => {
    authState.user = null;
    window.history.pushState({}, "", "/login");

    render(<App />);

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders protected pages with bottom navigation for signed-in users", () => {
    window.history.pushState({}, "", "/market");

    render(<App />);

    expect(screen.getByText("Market page")).toBeInTheDocument();
    expect(screen.getByText("Bottom nav")).toBeInTheDocument();
  });

  it("shows the loading screen while auth is still initializing", () => {
    authState.loading = true;

    render(<App />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});