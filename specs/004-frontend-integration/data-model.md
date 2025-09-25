# Data Model: Frontend Consumes Posts API

## Entities

### Post
- id: string
- title: string
- content: string
- tags?: string[]
- published: boolean
- createdAt: string (ISO)
- updatedAt: string (ISO)

### PostList
- page: number
- pageSize: number
- hasNextPage: boolean
- items: Post[]
- totalItems?: number
- totalPages?: number
- currentPage?: number

## Validation
- title: required, min 1
- content: required, min 1

## State Transitions
- Create Post (201): adds item; list resets to page 1 and revalidates.


