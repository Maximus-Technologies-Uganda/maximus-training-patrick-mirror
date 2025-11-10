import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NewPostForm } from "./NewPostForm";
import { server } from "../test/test-server";

// Mock SWR mutate function
vi.mock("../lib/swr", () => ({
  mutatePostsPage1: vi.fn().mockResolvedValue(undefined),
}));

describe("NewPostForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders form with title and content inputs", () => {
    render(<NewPostForm pageSize={10} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<NewPostForm pageSize={10} />);

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/posts", () => {
        return HttpResponse.json({ id: "1", title: "Test", content: "Content" }, { status: 201 });
      })
    );

    render(<NewPostForm pageSize={10} />);

    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);
    const submitButton = screen.getByRole("button", { name: /create/i });

    await user.type(titleInput, "Test Post");
    await user.type(contentInput, "Test Content");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/post created successfully/i);
    });
  });

  it("shows error message on API failure", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/posts", () => {
        return HttpResponse.json({ message: "Server error" }, { status: 500 });
      })
    );

    render(<NewPostForm pageSize={10} />);

    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);
    const submitButton = screen.getByRole("button", { name: /create/i });

    await user.type(titleInput, "Test Post");
    await user.type(contentInput, "Test Content");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to create post/i);
    });
  });

  it("clears form after successful submission", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/posts", () => {
        return HttpResponse.json({ id: "1" }, { status: 201 });
      })
    );

    render(<NewPostForm pageSize={10} />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;

    await user.type(titleInput, "Test Post");
    await user.type(contentInput, "Test Content");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(titleInput.value).toBe("");
      expect(contentInput.value).toBe("");
    });
  });

  it("calls onSuccessAction callback on success", async () => {
    const user = userEvent.setup();
    const onSuccessAction = vi.fn();
    server.use(
      http.post("/api/posts", () => {
        return HttpResponse.json({ id: "1" }, { status: 201 });
      })
    );

    render(<NewPostForm pageSize={10} onSuccessAction={onSuccessAction} />);

    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);

    await user.type(titleInput, "Test Post");
    await user.type(contentInput, "Test Content");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(onSuccessAction).toHaveBeenCalledTimes(1);
    });
  });

  it("disables submit button while submitting", async () => {
    const user = userEvent.setup();
    let resolveRequest: () => void;
    const requestPromise = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post("/api/posts", async () => {
        await requestPromise;
        return HttpResponse.json({ id: "1" }, { status: 201 });
      })
    );

    render(<NewPostForm pageSize={10} />);

    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);
    const submitButton = screen.getByRole("button", { name: /create/i });

    await user.type(titleInput, "Test Post");
    await user.type(contentInput, "Test Content");
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveRequest!();
  });

  it("clears field errors when user types", async () => {
    const user = userEvent.setup();
    render(<NewPostForm pageSize={10} />);

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, "Test");

    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  it("handles network errors", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/posts", () => {
        return HttpResponse.error();
      })
    );

    render(<NewPostForm pageSize={10} />);

    const titleInput = screen.getByLabelText(/title/i);
    const contentInput = screen.getByLabelText(/content/i);

    await user.type(titleInput, "Test Post");
    await user.type(contentInput, "Test Content");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/network error/i);
    });
  });

  it("focuses on first error field", async () => {
    const user = userEvent.setup();
    render(<NewPostForm pageSize={10} />);

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveFocus();
    });
  });

  it("applies custom className", () => {
    const { container } = render(<NewPostForm pageSize={10} className="custom-class" />);
    const form = container.querySelector("form");
    expect(form).toHaveClass("custom-class");
  });
});
