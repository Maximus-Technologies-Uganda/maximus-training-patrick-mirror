## Posts API Quickstart

Get the Posts API running locally in minutes and try the core CRUD endpoints.

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+

### Install
```bash
cd api
npm install
```

### Start the API (development)
```bash
npm run dev
```
- Base URL: `http://localhost:3000`
- Health check: `GET /health` → `{ "status": "ok" }`
- OpenAPI spec (dev only): `GET /openapi.json`

### Configuration (env)
Create an optional `.env` file in `api/` or export env vars.

- **PORT**: HTTP port (default: `3000`)
- **JSON_LIMIT**: Max JSON body size (default: `256kb`)
- **RATE_LIMIT_WINDOW_MS**: Rate limit window in ms (default: `60000`)
- **RATE_LIMIT_MAX**: Max requests per window (default: `100`)

Example:
```bash
PORT=3000
JSON_LIMIT=512kb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200
```

### Data model (summary)
See `specs/002-posts-api/contracts/openapi.yml` for the full schema. Key shapes:
- **Post**: `{ id, title, content, tags?, published, createdAt, updatedAt }`
- **PostCreate**: `{ title, content, tags?, published? }`
- **PostUpdate**: Any subset of `PostCreate` (at least one field required)

### Endpoints

#### Create a post
```bash
curl -i -X POST "http://localhost:3000/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello",
    "content": "World",
    "tags": ["intro"],
    "published": true
  }'
```
- Response: `201 Created`
- Headers: `Location: /posts/{id}`
- Body: `Post`

#### List posts (paginated)
```bash
curl -s "http://localhost:3000/posts?page=1&pageSize=10" | jq
```
- Response: `200 OK`
- Body: `{ page, pageSize, hasNextPage, items: Post[] }`

#### Get a post by id
```bash
curl -s "http://localhost:3000/posts/{id}" | jq
```
- Response: `200 OK` with `Post`, or `404 Not Found` with error body

#### Replace a post (PUT)
```bash
curl -s -X PUT "http://localhost:3000/posts/{id}" \
  -H "Content-Type: application/json" \
  -d '{ "title": "New", "content": "Content" }' | jq
```
- Response: `200 OK` with `Post`, `400` on validation error, or `404` if missing

#### Update a post (PATCH)
```bash
curl -s -X PATCH "http://localhost:3000/posts/{id}" \
  -H "Content-Type: application/json" \
  -d '{ "content": "Updated" }' | jq
```
- Response: `200 OK` with `Post`, `400` on validation error, or `404` if missing

#### Delete a post
```bash
curl -i -X DELETE "http://localhost:3000/posts/{id}"
```
- Response: `204 No Content` on success, or `404 Not Found`

### Validation and errors
- All request bodies must be `application/json` and conform to the schemas.
- Unknown properties or invalid values return a 4xx JSON error body:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": { /* ... */ }
}
```

### Rate limiting
By default, requests are limited to `RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS` per IP.
Exceeding the limit returns `429 Too Many Requests`.

### OpenAPI contract
- Live spec (dev): `GET /openapi.json`
- Source of truth: `specs/002-posts-api/contracts/openapi.yml`
- Validate the built spec served by the API:
```bash
cd api
npm run build
npm run test:oas
```

### Run tests
```bash
cd api
npm test
```

### Production start
Build and run the compiled JS entrypoint:
```bash
cd api
npm run build
npm start
```


