# Quickstart – Week 8 Identity Platform

## Prereqs
- Node 20.x, pnpm 9.x
- .env.local configured (see README truth table): API_BASE_URL, NEXT_PUBLIC_API_URL, Firebase config, SESSION_SECRET

## Install
```
corepack enable && corepack prepare pnpm@9.x --activate
pnpm install
```

## Dev
```
pnpm --filter frontend-next dev
pnpm --filter api dev
```

## Build
```
pnpm build
```

## Tests / Evidence
```
pnpm run test:types && pnpm run lint
# Frontend a11y smoke (produces HTML under a11y-frontend-next/<commit-sha>/)
# API contract tests: ensure 200/401/403/404/422/429 pass
```

## Try It
- Visit http://localhost:5000
- Login, create/edit/delete own posts (owner); verify admin can mutate any post
