"use client";

import Link from "next/link";
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

  const isSubmitDisabled = useMemo(() => {
    return normalize(userId.value) === "" || normalize(name.value) === "";
  }, [name.value, userId.value]);

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
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

    const session: StoredSession = { userId: nextUserId, name: nextName, role: "owner" };
    writeSession(session);
    setFormError(null);
    router.push("/posts");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
      <section className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your information to continue. You can manage posts you own once signed in.
        </p>
        {formError ? (
          <div
            role="alert"
            className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="userId">
              User ID
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              className="mt-1 w-full rounded border border-gray-300 p-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={userId.value}
              onChange={(event) => {
                const value = event.target.value;
                setUserId({ value, error: null });
                if (formError) setFormError(null);
              }}
              autoComplete="username"
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
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              className="mt-1 w-full rounded border border-gray-300 p-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={name.value}
              onChange={(event) => {
                const value = event.target.value;
                setName({ value, error: null });
                if (formError) setFormError(null);
              }}
              autoComplete="name"
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
            className="w-full rounded bg-indigo-600 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            disabled={isSubmitDisabled}
          >
            Continue
          </button>
        </form>
      </section>
      <p className="mt-4 text-center text-sm text-gray-600">
        Looking for posts? <Link className="text-indigo-600 hover:underline" href="/posts">Go to posts</Link>.
      </p>
    </main>
  );
}
