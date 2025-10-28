import { redactValue, sanitizeLogEntry, REDACTED } from "../src/logging/redaction";

describe("logging redaction", () => {
  it("redacts email addresses in strings", () => {
    const result = redactValue("contact user@example.com for help");
    expect(result).not.toContain("user@example.com");
    expect(result).toContain(REDACTED);
  });

  it("redacts unicode email addresses", () => {
    const first = redactValue("send to müller@büro.de");
    const second = redactValue("direct reply to χρήστης@παράδειγμα.ελ");
    expect(first).toContain(REDACTED);
    expect(first).not.toContain("müller@büro.de");
    expect(second).toContain(REDACTED);
    expect(second).not.toContain("χρήστης@παράδειγμα.ελ");
  });

  it("redacts jwt-like tokens", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoic2VjcmV0In0.signature";
    const result = redactValue(token);
    expect(result).toBe(REDACTED);
  });

  it("does not redact non-jwt base64 strings", () => {
    const token = "YWJjLmRlZi5naGk";
    const result = redactValue(token);
    expect(result).toBe(token);
  });

  it("redacts sensitive object keys", () => {
    const entry = sanitizeLogEntry({
      authorization: "Bearer secret-token",
      cookie: "session=abc; csrf=def",
      payload: { email: "user@example.com" },
      allowed: "value",
    });

    expect(entry.authorization).toBe(REDACTED);
    expect(entry.cookie).toBe(REDACTED);
    expect(entry.payload).toBe(REDACTED);
    expect(entry.allowed).toBe("value");
  });
});

