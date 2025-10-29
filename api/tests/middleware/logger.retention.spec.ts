import { describe, expect, it, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { requestLogger } from '../../src/middleware/logger';
import { APPLICATION_LOG_RETENTION_DAYS } from '../../src/logging/retention';

interface RequestUser {
  userId: string;
  role: string;
}

interface MockRequest {
  method: string;
  originalUrl: string;
  user: RequestUser;
}

interface MockResponse extends EventEmitter {
  statusCode: number;
  locals: { requestId: string };
  getHeader: jest.MockedFunction<(name: string) => string | undefined>;
}

describe('requestLogger retention enforcement', () => {
  it('attaches retentionDays to structured log entries', () => {
    const req: MockRequest = {
      method: 'get',
      originalUrl: '/posts',
      user: { userId: 'user-1', role: 'owner' },
    };

    const res: MockResponse = new EventEmitter() as MockResponse;
    res.statusCode = 200;
    res.locals = { requestId: 'req-123' };
    res.getHeader = jest.fn();

    const writes: string[] = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = jest.fn((chunk: string) => {
      writes.push(chunk);
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      let nextCalled = false;
      requestLogger(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);

      res.emit('finish');

      expect(writes).toHaveLength(1);
      const payload = JSON.parse(writes[0]);
      expect(payload.retentionDays).toBe(APPLICATION_LOG_RETENTION_DAYS);
      expect(payload.service).toBe('api');
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});
