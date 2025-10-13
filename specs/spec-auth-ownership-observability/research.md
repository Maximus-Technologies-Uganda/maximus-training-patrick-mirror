# Research: Auth, Ownership, Observability

## Decisions

- Credential flow: Username + password (per spec)
- Session lifetime: 24h absolute, 60m idle; rotation on use (per spec)
- Correlation header: `X-Request-Id`

## Rationale

- Username + password offers simplest viable AuthN for baseline ownership enforcement.
- 24h/60m balances usability and security for session duration and idle expiry.
- `X-Request-Id` is widely adopted for correlation across services.

## Alternatives Considered

- Passwordless OTP: Deferred for simplicity and scope control.
- `X-Correlation-Id` or W3C traceparent: Traceparent is richer but out of scope; `X-Request-Id` sufficient for first phase.
- Longer TTLs (7d) or shorter (12h/30m): Selected middle-ground consistent with spec assumptions.
