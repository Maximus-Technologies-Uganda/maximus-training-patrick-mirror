"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { writeSession, type StoredSession } from "../../lib/auth/session";

interface FieldState {
  value: string;
  error: string | null;
}

const initialFieldState: FieldState = { value: "", error: null };

function normalize(value: string): string {
  return value.trim();
}

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [userId, setUserId] = useState<FieldState>(initialFieldState);
  const [name, setName] = useState<FieldState>(initialFieldState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return normalize(userId.value) === "" || normalize(name.value) === "";
  }, [name.value, userId.value]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextUserId = normalize(userId.value);
    const nextName = normalize(name.value);
    let hasError = false;

    if (!nextUserId) {
      setUserId((prev) => ({ ...prev, error: "User ID is required" }));
      hasError = true;
    }
    if (!nextName) {
      setName((prev) => ({ ...prev, error: "Name is required" }));
      hasError = true;
    }

    if (hasError) {
      setFormError("Please correct the errors below.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: nextUserId, name: nextName }),
      });
      if (!response.ok) {
        const isUnauthorized = response.status === 401;
        setFormError(
          isUnauthorized
            ? "Invalid credentials. Please try again."
            : "Failed to sign in. Please try again."
        );
        return;
      }

      const session: StoredSession = { userId: nextUserId, name: nextName, role: "owner" };
      writeSession(session);
      router.push("/posts");
    } catch {
      setFormError("Unable to sign in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <section className="rounded-lg border-2 border-purple-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your information to continue. You can manage posts you own once signed in.
          </p>
        </div>
        <div className="mt-3 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-4 text-sm border-2 border-blue-200">
          <p className="font-semibold text-blue-900">Demo Credentials:</p>
          <p className="mt-2 text-blue-800">
            User ID:{" "}
            <code className="rounded bg-blue-200 px-2 py-1 font-mono font-semibold">admin</code>
          </p>
          <p className="text-blue-800">
            Display Name:{" "}
            <code className="rounded bg-blue-200 px-2 py-1 font-mono font-semibold">admin</code>
          </p>
        </div>
        {formError ? (
          <div
            role="alert"
            className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          {/* 
            Note: This form uses "User ID" and "Display name" fields instead of traditional 
            "username" and "password" fields. The API endpoint supports both formats:
            - userId/name (used by this form)
            - username/password (fallback for local/CI environments)
            The field names align with the application's authentication model where users
            are identified by a User ID and authenticated with a Display name.
          */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="userId">
              User ID <span className="text-gray-500 font-normal">(e.g., admin, user123)</span>
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              className="mt-1 w-full rounded-lg border-2 border-purple-200 p-2.5 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-colors"
              value={userId.value}
              onChange={(event) => {
                const value = event.target.value;
                setUserId({ value, error: null });
                if (formError) setFormError(null);
              }}
              autoComplete="username"
              placeholder="Enter your user ID"
              required
            />
            {userId.error ? (
              <p className="mt-1 text-sm text-red-600" id="userId-error">
                {userId.error}
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
              Display Name{" "}
              <span className="text-gray-500 font-normal">(how your name appears)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              className="mt-1 w-full rounded-lg border-2 border-purple-200 p-2.5 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-colors"
              value={name.value}
              onChange={(event) => {
                const value = event.target.value;
                setName({ value, error: null });
                if (formError) setFormError(null);
              }}
              autoComplete="name"
              placeholder="Enter your display name"
              required
            />
            {name.error ? (
              <p className="mt-1 text-sm text-red-600" id="displayName-error">
                {name.error}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 text-white font-semibold transition-all hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
            disabled={isSubmitDisabled || isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Continue"}
          </button>
        </form>
      </section>
      <p className="mt-4 text-center text-sm text-gray-600">
        Looking for posts?{" "}
        <a
          className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
          href="/posts"
        >
          Go to posts
        </a>
        .
      </p>
    </main>
  );
}
