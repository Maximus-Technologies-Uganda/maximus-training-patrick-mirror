"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const appModule = __importStar(require("#tsApp"));
const jest_openapi_1 = __importDefault(require("jest-openapi"));
const path_1 = __importDefault(require("path"));
const apiSpecPath = path_1.default.resolve(__dirname, '..', 'openapi.json');
(0, jest_openapi_1.default)(apiSpecPath);
function getApp() {
    const mod = appModule;
    if (mod.default && typeof mod.default === 'function' && typeof mod.default.use === 'function')
        return mod.default;
    if (mod.app && typeof mod.app.use === 'function')
        return mod.app;
    if (typeof mod.createApp === 'function') {
        // Dynamically require JS modules to avoid TS type issues in tests
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { loadConfigFromEnv } = require('../src/config');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createRepository } = require('../src/repositories/posts-repository');
        const base = loadConfigFromEnv();
        const config = { ...base, rateLimitMax: 1000 };
        const repository = createRepository();
        return mod.createApp(config, repository);
    }
    throw new Error('Unable to resolve Express app from ../src/app');
}
describe('Posts API Integration Tests', () => {
    describe('GET /posts', () => {
        it('should return a paginated response object', async () => {
            const api = getApp();
            // Seed a few posts
            const payloads = [
                { title: 'P1', content: 'Content for P1 post' },
                { title: 'P2', content: 'Content for P2 post' },
                { title: 'P3', content: 'Content for P3 post' },
            ];
            for (const p of payloads) {
                const res = await (0, supertest_1.default)(api)
                    .post('/posts')
                    .send(p)
                    .set('Content-Type', 'application/json');
                expect(res.status).toBe(201);
            }
            const res = await (0, supertest_1.default)(api).get('/posts').query({ page: 1, pageSize: 2 });
            expect(res.status).toBe(200);
            const body = res.body;
            expect(typeof body).toBe('object');
            expect(Array.isArray(body.items)).toBe(true);
            // Accept either the new PaginatedResponse shape or the legacy JS API contract shape
            if (typeof body.totalItems === 'number') {
                expect(typeof body.totalPages).toBe('number');
                expect(typeof body.currentPage).toBe('number');
                if (body.hasNextPage !== undefined) {
                    expect(typeof body.hasNextPage).toBe('boolean');
                }
                expect(body.currentPage).toBe(1);
            }
            else {
                expect(typeof body.page).toBe('number');
                expect(typeof body.pageSize).toBe('number');
                expect(typeof body.hasNextPage).toBe('boolean');
                expect(body.page).toBe(1);
            }
            expect(body.items.length).toBeLessThanOrEqual(2);
        });
    });
    describe('GET /health', () => {
        it('should respond with 200 and { status: "ok" }', async () => {
            const api = getApp();
            const res = await (0, supertest_1.default)(api).get('/health');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: 'ok' });
            expect(res).toSatisfyApiSpec();
        });
    });
    describe('POST /posts', () => {
        it('should return a 4xx client error for invalid input', async () => {
            const api = getApp();
            const res = await (0, supertest_1.default)(api)
                .post('/posts')
                .send({})
                .set('Content-Type', 'application/json');
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        });
        it('should handle the full CRUD lifecycle of a post', async () => {
            const api = getApp();
            // CREATE
            const createPayload = { title: 'Integration Title', content: 'This is the integration test content.' };
            const createRes = await (0, supertest_1.default)(api)
                .post('/posts')
                .send(createPayload)
                .set('Content-Type', 'application/json');
            expect(createRes.status).toBe(201);
            expect(createRes.headers['location']).toMatch(/^\/posts\/[A-Za-z0-9_-]+$/);
            expect(typeof createRes.body.id).toBe('string');
            const id = createRes.body.id;
            expect(createRes).toSatisfyApiSpec();
            // READ
            const getRes1 = await (0, supertest_1.default)(api).get(`/posts/${id}`);
            expect(getRes1.status).toBe(200);
            expect(getRes1.body).toMatchObject({ id, ...createPayload });
            expect(getRes1).toSatisfyApiSpec();
            // UPDATE
            const patchPayload = { content: 'This content has been updated by the integration test.' };
            const patchRes = await (0, supertest_1.default)(api)
                .patch(`/posts/${id}`)
                .send(patchPayload)
                .set('Content-Type', 'application/json');
            expect(patchRes.status).toBe(200);
            expect(patchRes.body).toMatchObject({ id, ...createPayload, ...patchPayload });
            expect(patchRes).toSatisfyApiSpec();
            // VERIFY UPDATE
            const getRes2 = await (0, supertest_1.default)(api).get(`/posts/${id}`);
            expect(getRes2.status).toBe(200);
            expect(getRes2.body).toMatchObject({ id, ...createPayload, ...patchPayload });
            expect(getRes2).toSatisfyApiSpec();
            // DELETE
            const deleteRes = await (0, supertest_1.default)(api).delete(`/posts/${id}`);
            expect(deleteRes.status).toBe(204);
            expect(deleteRes).toSatisfyApiSpec();
            // VERIFY DELETE
            const getRes3 = await (0, supertest_1.default)(api).get(`/posts/${id}`);
            expect(getRes3.status).toBe(404);
        });
        it('should return a 4xx error for requests with unknown fields', async () => {
            const api = getApp();
            const payload = {
                title: 'Valid Title',
                content: 'Valid content for the post.',
                unknownField: 'test',
            };
            const res = await (0, supertest_1.default)(api)
                .post('/posts')
                .send(payload)
                .set('Content-Type', 'application/json');
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.status).toBeLessThan(500);
        });
    });
    describe('Rate Limiting', () => {
        it('should return a 429 Too Many Requests error after exceeding the limit', async () => {
            // Build an app instance with the default limiter threshold (100)
            // using the JS factory to avoid TS module resolution issues in tests.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { createApp } = require('../src/app');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { loadConfigFromEnv } = require('../src/config');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { createRepository } = require('../src/repositories/posts-repository');
            const base = loadConfigFromEnv();
            const config = { ...base, rateLimitMax: 100, rateLimitWindowMs: 15 * 60 * 1000 };
            const repository = createRepository();
            const api = createApp(config, repository);
            const promises = [];
            for (let i = 0; i < 101; i++) {
                promises.push((0, supertest_1.default)(api).get('/health'));
            }
            await Promise.all(promises);
            const res = await (0, supertest_1.default)(api).get('/health');
            expect(res.status).toBe(429);
        });
    });
});
