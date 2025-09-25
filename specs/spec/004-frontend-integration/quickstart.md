# Quickstart: Frontend Consumes Posts API

## Prerequisites
- Node 18+
- NEXT_PUBLIC_API_URL set in `.env` or build environment

## Steps
1. Create a Next.js App Router project under `frontend-next/`.
2. Add dependencies: `npm i next react react-dom swr zod`.
3. Implement `/app/posts/page.tsx` with client SWR fetching `GET /posts?page=&pageSize=` from `NEXT_PUBLIC_API_URL`.
4. Add `NewPostForm` to submit `POST /posts`; on success, clear form and `mutate` the list for page 1.
5. Add `PaginationControls`, `PageSizeSelect`, and `SearchInput` with URL sync.
6. Build static export: `next build && next export`.
7. Deploy to GitHub Pages; ensure API CORS allows the pages origin.

## Verify
- Loading/error/empty states display correctly.
- Pagination and URL sync work.
- Client search filters only current page items.
- Create success shows alert and refreshes list to show new post on page 1.


