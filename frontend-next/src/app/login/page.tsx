"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage(): React.ReactElement {
  const _router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 204) {
        // Force a full navigation so server-side Header re-reads cookies reliably
        window.location.assign("/posts");
        return;
      }
      if (res.status === 401) {
        setError("Invalid username or password.");
        return;
      }
      setError("Unexpected error. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {error && (
        <div role="alert" className="mt-3 rounded border border-red-300 bg-red-50 p-2 text-red-800">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-gray-700">
          Username
          <input
            aria-label="Username"
            autoComplete="username"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block text-sm text-gray-700">
          Password
          <input
            aria-label="Password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="pt-2">
          <button type="submit" disabled={isSubmitting} className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50">
            Sign in
          </button>
        </div>
      </form>
      <div aria-live="polite" className="sr-only">{error ? "Error: " + error : ""}</div>
    </main>
  );
}


