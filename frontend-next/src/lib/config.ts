import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
});

export function getBaseUrl(): string {
  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });
  if (!parsed.success) {
    // Fall back with a clear console error for debugging
    // Keeping behavior non-throwing to avoid breaking tests without env
    // but ensuring a valid URL string is always returned.
    console.error(
      "Invalid NEXT_PUBLIC_API_URL; falling back to http://localhost:3000",
      parsed.error.flatten(),
    );
    return "http://localhost:3000";
  }
  return parsed.data.NEXT_PUBLIC_API_URL;
}


