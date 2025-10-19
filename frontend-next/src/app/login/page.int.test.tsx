import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "./page";

// Mock App Router hooks for component to mount without Next.js app router context
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

const originalLocation = window.location;

afterEach(() => {
  // restore location after each test
  Object.defineProperty(window, 'location', { value: originalLocation, writable: false });
});

describe("LoginPage", () => {
  it("submits and handles 204 success by assigning location", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(null, { status: 204 }));
    const assign = vi.fn();
    // redefine location with writable property for assign
    Object.defineProperty(window, 'location', { value: { ...originalLocation, assign }, writable: true });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(assign).toHaveBeenCalled());
  });
});


