import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../src/components/Button";
import { PaginationControls } from "../../src/components/PaginationControls";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorState } from "../../src/components/ErrorState";

/**
 * Button Form Submission Tests
 *
 * These tests verify that Button components do NOT accidentally submit forms
 * when used for non-submit actions (pagination, retry, etc).
 *
 * **Bug Context:**
 * HTML <button> defaults to type="submit" if not specified. This caused
 * PaginationControls, EmptyState, and ErrorState to accidentally submit
 * forms when embedded inside form elements.
 */
describe("Button - Form Submission Prevention", () => {
  it("does not submit form by default", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <Button>Click me</Button>
      </form>
    );

    await user.click(screen.getByRole("button"));

    // Form should NOT be submitted
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits form when type='submit' is specified", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit}>
        <Button type="submit">Submit</Button>
      </form>
    );

    await user.click(screen.getByRole("button"));

    // Form SHOULD be submitted
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("PaginationControls does not submit form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const handleNext = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Search" />
        <PaginationControls
          currentPage={1}
          totalPages={10}
          onPrevious={() => {}}
          onNext={handleNext}
        />
      </form>
    );

    // Click Next button
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Pagination handler should be called
    expect(handleNext).toHaveBeenCalledTimes(1);

    // Form should NOT be submitted
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("EmptyState action does not submit form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const handleAction = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Name" />
        <EmptyState
          title="No items"
          message="Create your first item"
          action={{ label: "Create", onClick: handleAction }}
        />
      </form>
    );

    // Click Create button
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Action handler should be called
    expect(handleAction).toHaveBeenCalledTimes(1);

    // Form should NOT be submitted
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("ErrorState retry does not submit form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const handleRetry = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Email" />
        <ErrorState
          title="Error"
          message="Failed to load"
          onRetry={handleRetry}
        />
      </form>
    );

    // Click Retry button
    await user.click(screen.getByRole("button", { name: /retry/i }));

    // Retry handler should be called
    expect(handleRetry).toHaveBeenCalledTimes(1);

    // Form should NOT be submitted
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("multiple buttons in form - only submit button triggers submission", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const handleCancel = vi.fn();

    render(
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" />
        <Button onClick={handleCancel}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </form>
    );

    // Click Cancel (type='button')
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();

    // Click Submit (type='submit')
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
