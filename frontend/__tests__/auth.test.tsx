import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "../app/(auth)/login/page";
import SignupPage from "../app/(auth)/signup/page";
import DashboardLayout from "../app/(dashboard)/layout";

// Mock in-memory localStorage for Node test environment
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value.toString();
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    store = {};
  }),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock next/navigation
const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "redirect" ? "/dashboard/pools" : null),
  }),
  usePathname: () => "/dashboard/pools",
}));

describe("Login & Signup Password Visibility (Eye Icon)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store = {};
  });

  it("toggles password visibility on Login page when eye button is clicked", () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    // Click show password
    const toggleBtn = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe("text");
    expect(screen.getByLabelText(/hide password/i)).toBeDefined();

    // Click again to hide
    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput.type).toBe("password");
  });

  it("toggles password visibility on Signup page when eye button is clicked", () => {
    render(<SignupPage />);

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    // Click show password
    const toggleBtn = screen.getByLabelText(/show password/i);
    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe("text");
    expect(screen.getByLabelText(/hide password/i)).toBeDefined();

    // Click again to hide
    fireEvent.click(screen.getByLabelText(/hide password/i));
    expect(passwordInput.type).toBe("password");
  });
});

describe("Dashboard Auth Guard (Protected Route)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store = {};
  });

  it("redirects unauthenticated users to /login with redirect parameter", () => {
    render(
      <DashboardLayout>
        <div>Protected Content</div>
      </DashboardLayout>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login?redirect=%2Fdashboard%2Fpools");
    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  it("renders protected content when user has an active auth token", () => {
    store["sp_token"] = "valid-jwt-token";

    render(
      <DashboardLayout>
        <div>Protected Content</div>
      </DashboardLayout>
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("Protected Content")).toBeDefined();
  });
});
