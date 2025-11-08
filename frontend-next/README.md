This is a [Next.js](https://nextjs.org) application configured for SSR on Cloud Run with server Route Handlers.

## Live Demos & Deployment

### Production Environments

| Environment     | URL                                                                  | Region          | Status      |
| --------------- | -------------------------------------------------------------------- | --------------- | ----------- |
| **Production**  | https://maximus-training-frontend-673209018655.africa-south1.run.app | `africa-south1` | ✅ Active   |
| **Development** | http://localhost:3000 (local)                                        | Local           | 🔧 Dev only |
| **Staging**     | TBD                                                                  | TBD             | ⏳ Planned  |

### API Integration

- **Upstream API (Production)**: https://maximus-training-api-673209018655.africa-south1.run.app
- **Upstream API (Local)**: http://localhost:3000 (default)
- **Service Account**: Cloud Run service identity with IAM roles for API access
- **Authentication**: IAP (Identity-Aware Proxy) or Workload Identity Federation

---

## Design System & Tokens

This project uses a comprehensive design token system documented in Figma and synced with the codebase.

### Tokens Overview

| Category       | Count  | Examples                                             | Location                                  |
| -------------- | ------ | ---------------------------------------------------- | ----------------------------------------- |
| **Colors**     | 6      | Primary, Secondary, Success, Warning, Error, Neutral | `frontend-next/src/styles/tokens.css`     |
| **Typography** | 3      | Heading (Inter), Body (Inter), Mono (IBM Plex Mono)  | `frontend-next/src/styles/typography.css` |
| **Spacing**    | 1 base | 4px, 8px, 16px, 24px, 32px, 48px, 64px               | `frontend-next/src/styles/spacing.css`    |
| **Radius**     | 1 base | 4px, 8px, 12px, 999px (full)                         | `frontend-next/src/styles/radius.css`     |

**Total: 11 core tokens** → All exported as CSS custom properties

### CSS Variables (Complete Reference)

#### Colors

```css
/* Primary Actions & Accents */
--color-primary: #0066cc;

/* Secondary Actions & Text */
--color-secondary: #6b7280;

/* Success States */
--color-success: #10b981;

/* Warnings & Caution */
--color-warning: #f59e0b;

/* Errors & Destructive Actions */
--color-error: #ef4444;

/* Backgrounds, Borders, Disabled States */
--color-neutral: #f3f4f6;
```

#### Typography

```css
/* Heading Font */
--font-heading: "Inter", sans-serif;

/* Body Font */
--font-body: "Inter", sans-serif;

/* Monospace Font */
--font-mono: "IBM Plex Mono", monospace;
```

#### Spacing (Base Unit: 8px)

```css
--spacing-base: 8px;
--spacing-xs: 4px; /* 0.5x */
--spacing-sm: 8px; /* 1x */
--spacing-md: 16px; /* 2x */
--spacing-lg: 24px; /* 3x */
--spacing-xl: 32px; /* 4x */
--spacing-2xl: 48px; /* 6x */
--spacing-3xl: 64px; /* 8x */
```

#### Border Radius (Base: 4px)

```css
--radius-base: 4px;
--radius-md: 8px; /* 2x */
--radius-lg: 12px; /* 3x */
--radius-full: 999px; /* Full circle */
```

### Component Usage Examples

**Button with Primary Token:**

```tsx
export function Button({ children, variant = "primary" }: ButtonProps) {
  const colorVar = variant === "primary" ? "--color-primary" : "--color-secondary";
  return (
    <button
      style={{
        backgroundColor: `var(${colorVar})`,
        borderRadius: "var(--radius-md)",
        padding: "var(--spacing-md) var(--spacing-lg)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </button>
  );
}
```

**Card with Neutral & Spacing Tokens:**

```tsx
export function Card({ children }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-neutral)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-xl)",
        gap: "var(--spacing-md)",
      }}
    >
      {children}
    </div>
  );
}
```

### Figma Reference

- **Figma Design Page**: [Week 9 Tokens & Primitives](https://figma.com/file/YOUR_FILE_ID) (requires Figma access)
- **Token Parity Checklist**: `specs/009-frontend-foundations/token-parity.md`
- **Exports**: `docs/design-system/figma-exports/` (PNG/PDF references)

### Accessibility & Compliance

- ✅ All color tokens meet **WCAG AA contrast** requirements (4.5:1 minimum)
- ✅ Typography tokens follow **accessible font sizes** (minimum 16px for body)
- ✅ Spacing tokens based on **8px grid system** for consistent layouts
- ✅ Radius tokens provide **clear affordances** and visual hierarchy

### Token Maintenance

1. **Add new token**: Update `frontend-next/src/styles/tokens.css`, add to Figma, update this README
2. **Deprecate token**: Mark deprecated with comment, create issue for migration, provide replacement
3. **Update existing token**: Sync Figma → CSS variables → Update docs → Create PR with evidence

---

## Run & Try (Next.js)

The browser makes calls to relative routes like `/api/posts`. Server Route Handlers proxy these calls to the upstream API using server-only configuration—no secrets are exposed to the client.

### Environment

| Variable              | Scope                      | Example                                                           | Purpose                                                                                                              |
| --------------------- | -------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Local dev and SSR fallback | `http://localhost:3000`                                           | Base URL for the API when running locally; also used by SSR if `API_BASE_URL` is not set.                            |
| `API_BASE_URL`        | Server-only (Cloud Run)    | `https://maximus-training-api-673209018655.africa-south1.run.app` | Upstream API base URL used by server Route Handlers.                                                                 |
| `API_SERVICE_TOKEN`   | Server-only (optional)     | `eyJ...`                                                          | Optional bearer token sent as `Authorization: Bearer <token>` for service-to-service calls.                          |
| `IAP_AUDIENCE`        | Server-only (prod)         | `<IAP OAuth Client ID>`                                           | If set, server routes mint an IAP ID token per request and attach `Authorization: Bearer <token>` to upstream calls. |
| `ID_TOKEN_AUDIENCE`   | Server-only (alt)          | `https://<cloud-run-api-url>`                                     | Alternative to IAP: set audience to Cloud Run service URL for IAM-authenticated calls (no LB).                       |
| `PORT`                | Runtime (container)        | `8080`                                                            | Provided by Cloud Run; the app binds to this port.                                                                   |

### Local Development

1. Install dependencies (repo root):
   ```bash
   npm install
   ```
2. Start the API (in another terminal):
   ```bash
   # from repo root
   npm --workspace api run dev
   # API listens on http://localhost:3000 by default
   ```
3. Create `frontend-next/.env.local` using the variables from the table above:
   ```bash
   # file: frontend-next/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:3000
   # Optional for local SSR/Route Handlers:
   # API_BASE_URL=http://localhost:3000
   # Optional service-to-service token:
   # API_SERVICE_TOKEN=your-local-token
   ```

# IAP/IAM (production only; typically not set for local dev):

# IAP_AUDIENCE=

# ID_TOKEN_AUDIENCE=

````
4. Start the frontend:
```bash
# from repo root
cd frontend-next
npm run dev
````

Note: If port 3000 is busy, Next.js may prompt to use another port (e.g., 3001). Accept the prompt. 5. Open the app:

- Visit the printed URL (e.g., http://localhost:3000 or http://localhost:3001) and go to `/posts`.
- You should see the posts list load and the loader clear.

### Troubleshooting

- Application stuck on "Loading...":
  - Ensure the API is running: in another terminal, run `npm --workspace api run dev` and confirm it listens on http://localhost:3000.
  - In the browser DevTools (Network tab), check `GET /api/posts`:
    - Expect status 200 and JSON. If pending/failing, the upstream API may be down or misconfigured.
  - Verify `frontend-next/.env.local` exists and contains a correct base URL:
    - `NEXT_PUBLIC_API_URL=http://localhost:3000`
    - Optionally set `API_BASE_URL=http://localhost:3000`
  - Restart the frontend dev server after changing `.env.local` (Next.js reads env vars at startup).

- Environment variable misconfiguration:
  - File location: `frontend-next/.env.local` (do not commit it).
  - Use exact variable names from the table. Values should be unquoted (no quotes) and without trailing spaces.
  - If your API runs on a different port (e.g., 3001), update `NEXT_PUBLIC_API_URL` accordingly and restart `npm run dev`.
  - To validate, reload the app and confirm `GET /api/posts` returns 200 with JSON.

### Build & Deploy (Cloud Run)

- GitHub Actions workflow: `.github/workflows/deploy-cloud-run.yml`
  - Trigger: push to `main`
  - Submits `cloudbuild.yaml` which:
    - Builds and pushes images to Artifact Registry
    - Deploys `maximus-training-frontend` in `africa-south1` with `min-instances=1`
    - Sets `API_BASE_URL` and binds to port `8080`
  - The job writes the Cloud Run service URL to the GitHub Job Summary

### Next.js Configuration

`next.config.ts` (SSR + standalone for Cloud Run):

```ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
```

## Server-Side Rendering (SSR)

The `/posts` page is server-rendered for a fast first-paint experience. On the initial request, the page fetches its data directly on the server and returns HTML with visible post content. Client-side navigation may show a brief loader, but first paint does not.

**How it works:**

- The `PostsPage` server component fetches posts using `API_BASE_URL` (or falls back to `NEXT_PUBLIC_API_URL` in development)
- Server responds with fully-rendered HTML containing post data
- Client hydrates with `initialData` from SSR, preventing flash of loading state
- SWR revalidates on mount to ensure fresh data without blocking the initial render

**Benefits:**

- Faster perceived load time (content visible immediately)
- Better SEO (search engines see rendered content)
- Improved Core Web Vitals (LCP, FCP)

For implementation details, see `src/app/posts/page.tsx` and `src/app/posts/PostsPageClient.tsx`.

### API Contracts

- `../api/openapi.json`
