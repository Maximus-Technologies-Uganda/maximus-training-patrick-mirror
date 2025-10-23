/**
 * securityHeaders.ts
 * Security headers baseline middleware
 *
 * Requirements (T050, T067):
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Content-Security-Policy: frame-ancestors 'none'; default-src 'self'; script-src 'self' 'nonce-<nonce>'
 * - Generate per-request nonce for CSP
 */

import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';

/**
 * Apply production security headers baseline
 * Should be placed after helmet() to layer additional explicit policies
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Generate a unique nonce for this request (for CSP script-src)
  const nonce = generateNonce();
  res.locals.cspNonce = nonce;

  // Referrer Policy: only send origin when crossing origins
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking - deny all framing
  res.setHeader('X-Frame-Options', 'DENY');

  // Content Security Policy
  // - frame-ancestors 'none': prevent framing (overlaps with X-Frame-Options)
  // - default-src 'self': only load resources from same origin by default
  // - script-src 'self' 'nonce-<nonce>': only execute scripts from same origin or with nonce
  const csp = [
    "frame-ancestors 'none'",
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  next();
}

/**
 * Generate a cryptographically secure random nonce
 * @returns Base64-encoded nonce string
 */
function generateNonce(): string {
  return randomBytes(16).toString('base64');
}
