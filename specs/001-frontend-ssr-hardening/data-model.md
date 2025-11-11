# Data Model – 001 Frontend SSR Hardening

## Posts Entity (In-Memory / Upstream API)

- id: string (uuid)
- title: string (1-140)
- author: string (slug)
- body: string (markdown subset)
- createdAt: ISO8601
- tags: string[] (≤8)

## Derived / View Model

- excerpt: first 160 chars plain text
- readingTime: ceil(words/220)

## Query Parameters (Validated via Zod)

- q?: string (trim, ≤64)
- author?: string (slug `[a-z0-9-]{2,32}`)
- sort?: enum('new','top') default 'new'

Normalization rules:

- Empty string → undefined
- sort invalid → fallback default

## Status Model

- ok: boolean
- traceId: string
- upstream: { ok: boolean; latency_ms?: number; status?: number }
- ts: ISO timestamp
- reason?: string (present if ok=false)

## Canonical Cache Key Inputs

{ path: '/posts', q?, author?, sort? }

Canonicalization:

- Remove undefined | empty
- Sort keys lexicographically except path first
- Encode values via encodeURIComponent
- Join: path + '?' + key=value pairs joined by '&'

Hash (parity test): sha256(JSON.stringify({data,meta}))

## Error Shape (OpenAPI & Zod)

- error: { code: string; message: string; traceId?: string }

## Future Extensions (Defer)

- pagination cursor
- tag filtering
