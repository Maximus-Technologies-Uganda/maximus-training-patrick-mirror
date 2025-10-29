import { sanitizeLogEntry } from '../src/logging/redaction';

describe('logging redaction snapshot', () => {
  it('redacts PII from structured payloads', () => {
    const payload = {
      ts: '2025-02-15T10:00:00.000Z',
      level: 'info' as const,
      service: 'api',
      request: {
        headers: {
          authorization: 'Bearer sample-secret-token',
          cookie: 'session=abc123; csrf=xyz789',
        },
        body: {
          email: 'person@example.com',
          token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkiLCJzdWIiOiIxMjMifQ.signature',
        },
      },
      response: {
        body: {
          message: 'Created',
          sensitive: {
            email: 'another@example.com',
            apiKey: 'secret-key-123',
          },
        },
      },
      events: [
        'Emitting to person@example.com',
        {
          description: 'Queued message',
          payload: {
            setCookie: 'session=def456',
            nested: [{ token: 'api-key-456' }],
          },
        },
      ],
    };

    const sanitized = sanitizeLogEntry(payload);

    expect(sanitized).toMatchInlineSnapshot(`
      {
        "events": [
          "Emitting to [redacted]",
          {
            "description": "Queued message",
            "payload": "[redacted]",
          },
        ],
        "level": "info",
        "request": {
          "body": "[redacted]",
          "headers": {
            "authorization": "[redacted]",
            "cookie": "[redacted]",
          },
        },
        "response": {
          "body": "[redacted]",
        },
        "service": "api",
        "ts": "2025-02-15T10:00:00.000Z",
      }
    `);
  });
});
