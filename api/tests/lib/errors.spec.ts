import { describe, it, expect, beforeEach } from '@jest/globals';
import type { Request, Response } from 'express';
import {
  createErrorEnvelope,
  createValidationErrorEnvelope,
  sendErrorResponse,
  StandardError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  PayloadTooLargeError,
  ServiceUnavailableError,
  ERROR_CODES,
  STATUS_BY_CODE,
} from '../../src/lib/errors';

describe('Standard Error System (T052)', () => {
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    mockRequest = {
      get: jest.fn(),
    } as unknown as Request;

    mockResponse = {
      get: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  describe('createErrorEnvelope', () => {
    it('creates basic error envelope with required fields', () => {
      const envelope = createErrorEnvelope('TEST_ERROR', 'Test error message');

      expect(envelope).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
    });

    it('includes requestId when available in request headers', () => {
      mockRequest.get = jest.fn().mockReturnValue('test-request-id');

      const envelope = createErrorEnvelope('TEST_ERROR', 'Test message', {
        request: mockRequest,
      });

      expect(envelope.requestId).toBe('test-request-id');
    });

    it('includes traceId when available in request traceparent', () => {
      mockRequest.get = jest.fn()
        .mockImplementation((header: string) => {
          if (header === 'traceparent') {
            return '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
          }
          return undefined;
        });

      const envelope = createErrorEnvelope('TEST_ERROR', 'Test message', {
        request: mockRequest,
      });

      expect(envelope.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    });

    it('includes custom traceId when provided', () => {
      const envelope = createErrorEnvelope('TEST_ERROR', 'Test message', {
        traceId: 'custom-trace-id',
      });

      expect(envelope.traceId).toBe('custom-trace-id');
    });

    it('includes details when provided', () => {
      const details = { field: 'title', issue: 'required' };
      const envelope = createErrorEnvelope('TEST_ERROR', 'Test message', {
        details,
      });

      expect(envelope.details).toBe(details);
    });
  });

  describe('createValidationErrorEnvelope', () => {
    it('creates validation error with structured details', () => {
      const validationDetails = [
        { path: 'title', issue: 'Title is required' },
        { path: 'body', issue: 'Body must be at least 10 characters' },
      ];

      const envelope = createValidationErrorEnvelope(
        'Validation failed',
        validationDetails,
        { request: mockRequest }
      );

      expect(envelope.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(envelope.message).toBe('Validation failed');
      expect(envelope.details).toEqual(validationDetails);
    });
  });

  describe('sendErrorResponse', () => {
    it('sends error response with correct status and envelope', () => {
      sendErrorResponse(mockResponse, ERROR_CODES.UNAUTHORIZED, 'Unauthorized access', {
        request: mockRequest,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Unauthorized access',
      });
    });

    it('sets cache control header for error responses', () => {
      sendErrorResponse(mockResponse, ERROR_CODES.UNAUTHORIZED, 'Unauthorized access');

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    });
  });

  describe('StandardError class', () => {
    it('creates StandardError with code and message', () => {
      const error = new StandardError('CUSTOM_ERROR', 'Custom error message', { extra: 'data' });

      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.message).toBe('Custom error message');
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.name).toBe('StandardError');
    });

    it('converts to envelope correctly', () => {
      const error = new StandardError('CUSTOM_ERROR', 'Custom message');
      const envelope = error.toEnvelope(mockRequest, mockResponse);

      expect(envelope.code).toBe('CUSTOM_ERROR');
      expect(envelope.message).toBe('Custom message');
    });

    it('sends response correctly', () => {
      const error = new StandardError('CUSTOM_ERROR', 'Custom message', undefined, 400);
      error.sendResponse(mockResponse, mockRequest);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('Specific error classes', () => {
    it('creates UnauthorizedError with correct defaults', () => {
      const error = new UnauthorizedError();

      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid or expired authentication token');
    });

    it('creates ForbiddenError with correct defaults', () => {
      const error = new ForbiddenError();

      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions to access this resource');
    });

    it('creates ValidationError with correct defaults', () => {
      const error = new ValidationError();

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Request validation failed');
    });

    it('creates RateLimitError with correct defaults', () => {
      const error = new RateLimitError();

      expect(error.code).toBe(ERROR_CODES.RATE_LIMITED);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded. Please try again later.');
    });

    it('creates PayloadTooLargeError with correct defaults', () => {
      const error = new PayloadTooLargeError();

      expect(error.code).toBe(ERROR_CODES.PAYLOAD_TOO_LARGE);
      expect(error.statusCode).toBe(413);
      expect(error.message).toBe('Request payload exceeds 1MB limit');
    });

    it('creates ServiceUnavailableError with correct defaults', () => {
      const error = new ServiceUnavailableError();

      expect(error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Service is in read-only mode');
    });
  });

  describe('Error code and status mapping', () => {
    it('maps all error codes to correct status codes', () => {
      expect(STATUS_BY_CODE[ERROR_CODES.UNAUTHORIZED]).toBe(401);
      expect(STATUS_BY_CODE[ERROR_CODES.FORBIDDEN]).toBe(403);
      expect(STATUS_BY_CODE[ERROR_CODES.VALIDATION_ERROR]).toBe(422);
      expect(STATUS_BY_CODE[ERROR_CODES.RATE_LIMITED]).toBe(429);
      expect(STATUS_BY_CODE[ERROR_CODES.PAYLOAD_TOO_LARGE]).toBe(413);
      expect(STATUS_BY_CODE[ERROR_CODES.SERVICE_UNAVAILABLE]).toBe(503);
      expect(STATUS_BY_CODE[ERROR_CODES.UNSUPPORTED_MEDIA_TYPE]).toBe(415);
      expect(STATUS_BY_CODE[ERROR_CODES.NOT_ACCEPTABLE]).toBe(406);
      expect(STATUS_BY_CODE[ERROR_CODES.NOT_FOUND]).toBe(404);
      expect(STATUS_BY_CODE[ERROR_CODES.INTERNAL_ERROR]).toBe(500);
    });

    it('includes all error codes in ERROR_CODES object', () => {
      const expectedCodes = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'VALIDATION_ERROR',
        'RATE_LIMITED',
        'PAYLOAD_TOO_LARGE',
        'SERVICE_UNAVAILABLE',
        'UNSUPPORTED_MEDIA_TYPE',
        'NOT_ACCEPTABLE',
        'NOT_FOUND',
        'INTERNAL_ERROR',
      ];

      expectedCodes.forEach(code => {
        expect(ERROR_CODES[code as keyof typeof ERROR_CODES]).toBe(code);
      });
    });
  });
});
