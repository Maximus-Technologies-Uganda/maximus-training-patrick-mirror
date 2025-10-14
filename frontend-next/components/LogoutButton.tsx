"use client";

import React, { useState } from "react";

export default function LogoutButton(): React.ReactElement {
  const [isPending, setIsPending] = useState(false);

  const onLogout = async (): Promise<void> => {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore network errors; proceed to refresh
    } finally {
      setIsPending(false);
      window.location.reload();
    }
  };

  return (
    <button onClick={onLogout} disabled={isPending} className="rounded bg-gray-800 px-3 py-1 text-white disabled:opacity-50">
      Logout
    </button>
  );
}


