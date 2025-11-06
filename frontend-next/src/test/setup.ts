import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./test-server";
import { DEFAULT_POST_SORT } from "../lib/schemas";

// Mock Next.js navigation hooks for all tests
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/posts"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

// Mock useSession hook for all tests
vi.mock("../lib/auth/use-session", () => ({
  useSession: vi.fn(() => ({
    session: null,
    isLoading: false,
    signOut: vi.fn(),
  })),
}));

// Mock SWR hooks - but allow tests to override
const usePostsListMock = vi.fn(() => ({
  data: { items: [], hasNextPage: false, page: 1, pageSize: 10, sort: DEFAULT_POST_SORT },
  isLoading: false,
  error: null,
}));

vi.mock("../lib/swr", () => ({
  usePostsList: usePostsListMock,
  mutatePostsPage1: vi.fn(),
}));

// Export for tests that need to override
export { usePostsListMock };

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
