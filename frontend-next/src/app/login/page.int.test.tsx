import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

// Mock App Router hooks for component to mount without Next.js app router context
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

// Mock session storage
vi.mock("../../lib/auth/session", () => ({
  writeSession: vi.fn(),
}));

describe("LoginPage", () => {
  it("renders login form with correct fields", async () => {
    render(<LoginPage />);

    // Check that the form fields are present
    expect(screen.getByLabelText(/user id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });
});


