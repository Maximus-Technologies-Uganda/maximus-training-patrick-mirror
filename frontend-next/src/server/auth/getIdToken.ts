import { GoogleAuth } from "google-auth-library";

export async function getIdToken(targetAudience: string): Promise<string> {
  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(targetAudience);
  const headers = (await client.getRequestHeaders()) as unknown as {
    get?: (name: string) => string | null;
    [key: string]: unknown;
  };
  const authorization =
    (typeof headers.get === "function" && (headers.get("Authorization") || headers.get("authorization"))) ||
    (typeof headers["Authorization"] === "string" ? (headers["Authorization"] as string) : "") ||
    (typeof headers["authorization"] === "string" ? (headers["authorization"] as string) : "");
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Failed to obtain ID token for IAP");
  }
  return authorization.slice("Bearer ".length);
}


