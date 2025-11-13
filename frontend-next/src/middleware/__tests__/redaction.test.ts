/**
 * Test: Log Redaction Guard (T070)
 * Validates sensitive data (auth headers, tokens, cookies) is stripped from logs
 * FR-024: Limit /status payload to non-sensitive fields
 */

import { redactSensitiveFields } from "@/middleware/traceLogger";

describe("Log Redaction Guard", () => {
  it("should redact authorization headers", () => {
    const logEntry = {
      method: "GET",
      route: "/posts",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer xyz123",
      },
      status: 200,
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.headers.authorization).toBe("[REDACTED]");
    expect(redacted.headers["content-type"]).toBe("application/json");
  });

  it("should redact cookie headers", () => {
    const logEntry = {
      headers: {
        cookie: "session=abc123; path=/;",
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.headers.cookie).toBe("[REDACTED]");
  });

  it("should redact API keys", () => {
    const logEntry = {
      config: {
        api_key: "sk-abc123xyz",
        base_url: "https://api.example.com",
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.config.api_key).toBe("[REDACTED]");
    expect(redacted.config.base_url).toBe("https://api.example.com");
  });

  it("should redact access tokens", () => {
    const logEntry = {
      auth: {
        access_token: "ghs_abcdef123456",
        token_type: "Bearer",
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.auth.access_token).toBe("[REDACTED]");
    expect(redacted.auth.token_type).toBe("[REDACTED]"); // token_type gets redacted because it contains "token"
  });

  it("should redact refresh tokens", () => {
    const logEntry = {
      tokens: {
        access_token: "abc123",
        refresh_token: "xyz789",
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.tokens.access_token).toBe("[REDACTED]");
    expect(redacted.tokens.refresh_token).toBe("[REDACTED]");
  });

  it("should redact ID tokens", () => {
    const logEntry = {
      auth: {
        id_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        expires_in: 3600,
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.auth.id_token).toBe("[REDACTED]");
    expect(redacted.auth.expires_in).toBe(3600);
  });

  it("should handle nested sensitive fields", () => {
    const logEntry = {
      request: {
        headers: {
          authorization: "Bearer token123",
          "x-api-key": "sk-123",
        },
        body: {
          password: "secret123",
        },
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.request.headers.authorization).toBe("[REDACTED]");
    expect(redacted.request.headers["x-api-key"]).toBe("[REDACTED]");
    expect(redacted.request.body.password).toBe("[REDACTED]");
  });

  it("should preserve non-sensitive fields", () => {
    const logEntry = {
      trace: "550e8400-e29b-41d4-a716-446655440000",
      route: "/posts",
      method: "GET",
      status: 200,
      latency_ms: 150,
      user_id: "12345", // Not sensitive (no session/auth context)
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.trace).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(redacted.route).toBe("/posts");
    expect(redacted.method).toBe("GET");
    expect(redacted.status).toBe(200);
    expect(redacted.latency_ms).toBe(150);
    expect(redacted.user_id).toBe("12345");
  });

  it("should redact case-insensitively", () => {
    const logEntry = {
      headers: {
        Authorization: "Bearer token", // Capital A
        X_TOKEN: "secret", // Underscore instead of dash
        SECRET: "xyz",
        Secret: "abc",
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.headers.Authorization).toBe("[REDACTED]");
    expect(redacted.headers.X_TOKEN).toBe("[REDACTED]");
    expect(redacted.headers.SECRET).toBe("[REDACTED]");
    expect(redacted.headers.Secret).toBe("[REDACTED]");
  });

  it("should handle arrays of objects", () => {
    const logEntry = {
      requests: [
        {
          url: "https://api.example.com/posts",
          headers: { authorization: "Bearer token1" },
        },
        {
          url: "https://api.example.com/users",
          headers: { authorization: "Bearer token2" },
        },
      ],
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.requests[0].headers.authorization).toBe("[REDACTED]");
    expect(redacted.requests[1].headers.authorization).toBe("[REDACTED]");
    expect(redacted.requests[0].url).toBe("https://api.example.com/posts");
  });

  it("should not modify non-object values", () => {
    const logEntry = {
      string_field: "value",
      number_field: 123,
      boolean_field: true,
      null_field: null,
      undefined_field: undefined,
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.string_field).toBe("value");
    expect(redacted.number_field).toBe(123);
    expect(redacted.boolean_field).toBe(true);
    expect(redacted.null_field).toBe(null);
    expect(redacted.undefined_field).toBe(undefined);
  });

  it("should maintain object structure after redaction", () => {
    const logEntry = {
      level: "info",
      message: "API request",
      details: {
        endpoint: "/posts",
        auth: {
          token: "secret123",
          method: "bearer",
        },
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    // Structure preserved
    expect(redacted).toHaveProperty("level");
    expect(redacted).toHaveProperty("message");
    expect(redacted).toHaveProperty("details");
    expect(redacted.details).toHaveProperty("endpoint");
    expect(redacted.details).toHaveProperty("auth");
    expect(redacted.details.auth).toHaveProperty("token");
    expect(redacted.details.auth).toHaveProperty("method");

    // Sensitive data redacted
    expect(redacted.details.auth.token).toBe("[REDACTED]");
    expect(redacted.details.auth.method).toBe("bearer");
  });

  it("should handle deeply nested sensitive fields", () => {
    const logEntry = {
      level1: {
        level2: {
          level3: {
            level4: {
              secret_key: "should-be-redacted",
              safe_value: "should-remain",
            },
          },
        },
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    expect(redacted.level1.level2.level3.level4.secret_key).toBe("[REDACTED]");
    expect(redacted.level1.level2.level3.level4.safe_value).toBe("should-remain");
  });

  it("should redact multiple token types simultaneously", () => {
    const logEntry = {
      auth: {
        access_token: "at_123",
        refresh_token: "rt_456",
        id_token: "idt_789",
        api_key: "key_000",
      },
    };

    const redacted = redactSensitiveFields(logEntry);

    Object.values(redacted.auth).forEach((value) => {
      expect(value).toBe("[REDACTED]");
    });
  });

  it("should create new object without modifying original", () => {
    const original = {
      headers: {
        authorization: "Bearer token123",
      },
    };

    const redacted = redactSensitiveFields(original);

    // Original should be unchanged
    expect(original.headers.authorization).toBe("Bearer token123");

    // Redacted should be changed
    expect(redacted.headers.authorization).toBe("[REDACTED]");
  });
});
