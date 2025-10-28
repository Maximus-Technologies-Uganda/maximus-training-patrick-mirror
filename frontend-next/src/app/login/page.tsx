"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { signIn as signInApi } from "../../lib/auth/auth";

function normalize(value: string): string {
  return value.trim();
}

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isSubmitDisabled = useMemo(() => {
    return normalize(username) === "" || normalize(password) === "" || isSubmitting;
  }, [username, password, isSubmitting]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const { ok } = await signInApi(username, password);
      if (!ok) {
        setFormError("Invalid username or password.");
        return;
      }
      router.push("/posts");
    } catch {
      setFormError("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
      <section className="rounded border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your credentials to continue.
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
            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="mt-1 w-full rounded border border-gray-300 p-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              aria-label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="mt-1 w-full rounded border border-gray-300 p-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            disabled={isSubmitDisabled}
          >
            Sign in
          </button>
        </form>
      </section>
      <p className="mt-4 text-center text-sm text-gray-600">
        Looking for posts? <Link className="text-indigo-600 hover:underline" href="/posts">Go to posts</Link>.
      </p>
    </main>
  );
}
