import { describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { validateIdentityHeaders } from '../../src/middleware/identityValidation';
import * as errors from '../../src/lib/errors';

interface RequestUser {
  userId?: string;
  role?: string;
  authTime?: number;
}

interface RequestWithUser extends Request {
  user?: RequestUser;
}

describe('Identity Validation Middleware (T053)', () => {
  let mockRequest: RequestWithUser;
  let mockResponse: Response;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      get: jest.fn(),
      headers: {},
    } as unknown as RequestWithUser;

    mockResponse = {
      setHeader: jest.fn(),
      get: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    nextFunction = jest.fn();
  });

  describe('when no authenticated user', () => {
    it('allows request when no identity headers present', () => {
      mockRequest.get = jest.fn().mockReturnValue(undefined);

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('rejects request when identity headers present without authentication', () => {
      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'user-123';
        if (header === 'X-User-Role') return 'owner';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'Identity headers cannot be present without authentication',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('when authenticated user present', () => {
    beforeEach(() => {
      mockRequest.user = {
        userId: 'authenticated-user-123',
        role: 'owner',
      };
    });

    it('allows request when no identity headers present', () => {
      mockRequest.get = jest.fn().mockReturnValue(undefined);

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('allows request when identity headers match authenticated user', () => {
      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'authenticated-user-123';
        if (header === 'X-User-Role') return 'owner';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('rejects request when X-User-Id header does not match', () => {
      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'different-user-456';
        if (header === 'X-User-Role') return 'owner';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'Identity header does not match authenticated user',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('rejects request when X-User-Role header does not match', () => {
      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'authenticated-user-123';
        if (header === 'X-User-Role') return 'admin';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'Identity header does not match authenticated user role',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('rejects request when X-User-Id header is not a string', () => {
      (mockRequest.headers as any)['x-user-id'] = 123; // non-string header

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'X-User-Id header must be a string',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('rejects request when X-User-Role header is not a string', () => {
      (mockRequest.headers as any)['x-user-role'] = 123; // non-string header

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'X-User-Role header must be a string',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('uses default role "owner" when authenticated user has no role', () => {
      (mockRequest as any).user = {
        userId: 'authenticated-user-123',
        // no role specified
      };

      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'authenticated-user-123';
        if (header === 'X-User-Role') return 'owner';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('rejects request when role header is "admin" but user has no role (defaults to owner)', () => {
      (mockRequest as any).user = {
        userId: 'authenticated-user-123',
        // no role specified, should default to 'owner'
      };

      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'authenticated-user-123';
        if (header === 'X-User-Role') return 'admin';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'Identity header does not match authenticated user role',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('header normalization', () => {
    beforeEach(() => {
      (mockRequest as any).user = {
        userId: 'authenticated-user-123',
        role: 'owner',
      };
    });

    it('reads headers using both get() and headers object', () => {
      (mockRequest.headers as any)['x-user-id'] = 'authenticated-user-123';
      (mockRequest.headers as any)['x-user-role'] = 'owner';

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('prioritizes get() method over headers object', () => {
      (mockRequest.headers as any)['x-user-id'] = 'wrong-user';
      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'authenticated-user-123';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('integration with StandardError', () => {
    it('uses ForbiddenError for identity mismatches', () => {
      (mockRequest as any).user = {
        userId: 'authenticated-user-123',
        role: 'owner',
      };

      mockRequest.get = jest.fn().mockImplementation((header: string) => {
        if (header === 'X-User-Id') return 'different-user-456';
        return undefined;
      });

      validateIdentityHeaders(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FORBIDDEN',
        }),
      );
    });
  });
});
