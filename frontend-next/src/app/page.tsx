import React from "react";
import { redirect } from "next/navigation";

export default function Home(): React.ReactElement {
  // Perform a server-side redirect for reliability in tests and production.
  redirect("/posts");
}
