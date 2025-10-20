# Features & Navigation (features-and-navigation.md)

_Last updated: TODO-YYYY-MM-DD_

## 1) Roles (example)
- **User**: view/create posts, login.
- **Admin** (future): moderation, org controls.

## 2) Primary journeys
- View posts → Create post → See updated list
- Login → Access protected pages

## 3) Frontend routes (subset)
| Path       | Type | Auth | Notes                    |
|------------|------|------|--------------------------|
| `/`        | SSR  | open | Landing / redirect       |
| `/posts`   | SSR  | open | List posts (SSR+SWR)     |
| `/login`   | SSR  | open | Auth placeholder         |
| `/api/*`   | RTE  | n/a  | Route handlers/proxy     |

**SSR first paint:** `/posts` must render meaningful HTML pre-hydration (see rules).

## 4) API surface (subset)
- `GET /posts`
- `POST /posts`
- `POST /auth/login` (placeholder)

Contracts live in `api/openapi.json`.

## 5) Navigation notes
- Avoid client-only flicker on SSR pages; provide `initialData`.
- Respect `NEXT_PUBLIC_*` for client config; keep server-only values on the server.

> Update this file when adding routes, features, or flows.

