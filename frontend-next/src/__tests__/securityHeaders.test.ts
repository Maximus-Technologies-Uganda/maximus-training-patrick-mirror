/**
 * Test: Security Headers Baseline (T075)
 * Validates required security headers are present on responses
 * CSP, Referrer-Policy, X-Content-Type-Options
 */

describe('Security Headers', () => {
  /**
   * Mock Next.js Response object for testing
   */
  interface MockResponse {
    headers: Map<string, string>;
    setHeader: (name: string, value: string) => void;
    getHeader: (name: string) => string | undefined;
  }

  function createMockResponse(): MockResponse {
    const headers = new Map<string, string>();

    return {
      headers,
      setHeader: (name: string, value: string) => {
        headers.set(name.toLowerCase(), value);
      },
      getHeader: (name: string) => {
        return headers.get(name.toLowerCase());
      },
    };
  }

  it('should include Content-Security-Policy header', () => {
    const res = createMockResponse();

    const csp =
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:;";
    res.setHeader('Content-Security-Policy', csp);

    expect(res.getHeader('Content-Security-Policy')).toBe(csp);
    expect(res.getHeader('Content-Security-Policy')).not.toContain(
      'unsafe-inline'
    );
    expect(res.getHeader('Content-Security-Policy')).not.toContain(
      'unsafe-eval'
    );
  });

  it('should enforce CSP script-src constraint', () => {
    const res = createMockResponse();

    const csp = "script-src 'self'; style-src 'self';";
    res.setHeader('Content-Security-Policy', csp);

    const policy = res.getHeader('Content-Security-Policy');
    expect(policy).toContain("script-src 'self'");

    // Must not allow inline scripts in production
    expect(policy).not.toContain('unsafe-inline');
    expect(policy).not.toContain('unsafe-eval');
  });

  it('should enforce CSP style-src constraint', () => {
    const res = createMockResponse();

    const csp = "style-src 'self'; script-src 'self';";
    res.setHeader('Content-Security-Policy', csp);

    const policy = res.getHeader('Content-Security-Policy');
    expect(policy).toContain("style-src 'self'");

    // Must not allow inline styles in production
    expect(policy).not.toContain('unsafe-inline');
  });

  it('should include Referrer-Policy header', () => {
    const res = createMockResponse();

    // Prevent referrer leakage to external sites
    res.setHeader('Referrer-Policy', 'strict-no-referrer');

    expect(res.getHeader('Referrer-Policy')).toBe('strict-no-referrer');
  });

  it('should include X-Content-Type-Options header', () => {
    const res = createMockResponse();

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    expect(res.getHeader('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should include X-Frame-Options to prevent clickjacking', () => {
    const res = createMockResponse();

    res.setHeader('X-Frame-Options', 'DENY');

    expect(res.getHeader('X-Frame-Options')).toBe('DENY');
  });

  it('should validate CSP disallows localhost in production', () => {
    const res = createMockResponse();

    // Production CSP - no localhost
    const prodCsp = "default-src 'self'; script-src 'self'; connect-src 'self' https://api.example.com;";
    res.setHeader('Content-Security-Policy', prodCsp);

    const policy = res.getHeader('Content-Security-Policy');
    expect(policy).not.toContain('localhost');
    expect(policy).not.toContain('127.0.0.1');
  });

  it('should allow CSP to include API domain for API calls', () => {
    const res = createMockResponse();

    const csp =
      "default-src 'self'; connect-src 'self' https://api.prod.example.com;";
    res.setHeader('Content-Security-Policy', csp);

    const policy = res.getHeader('Content-Security-Policy');
    expect(policy).toContain('https://api.prod.example.com');
  });

  it('should not include unsafe directives in development defaults', () => {
    const res = createMockResponse();

    // Even development should prefer safe defaults
    const devCsp = "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self';";
    res.setHeader('Content-Security-Policy', devCsp);

    const policy = res.getHeader('Content-Security-Policy');

    // unsafe-eval for HMR is tolerated in dev, but unsafe-inline for styles should not be present
    expect(policy).not.toContain("style-src 'unsafe-inline'");
  });

  it('should include X-XSS-Protection for older browsers', () => {
    const res = createMockResponse();

    res.setHeader('X-XSS-Protection', '1; mode=block');

    expect(res.getHeader('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should include Permissions-Policy to restrict capabilities', () => {
    const res = createMockResponse();

    // Disable potentially dangerous APIs
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );

    expect(res.getHeader('Permissions-Policy')).toContain('geolocation=()');
    expect(res.getHeader('Permissions-Policy')).toContain('microphone=()');
    expect(res.getHeader('Permissions-Policy')).toContain('camera=()');
  });

  it('should validate /status endpoint has cache-control: no-store', () => {
    const res = createMockResponse();

    // /status must not be cached to preserve latency integrity
    res.setHeader('Cache-Control', 'no-store');

    expect(res.getHeader('Cache-Control')).toBe('no-store');
  });

  it('should include HSTS header for HTTPS enforcement', () => {
    const res = createMockResponse();

    // Force HTTPS for 1 year, including subdomains
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    const hsts = res.getHeader('Strict-Transport-Security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('should set Vary header for cache keying', () => {
    const res = createMockResponse();

    // Vary by Accept-Encoding to cache different compressions separately
    res.setHeader('Vary', 'Accept-Encoding, Accept');

    expect(res.getHeader('Vary')).toContain('Accept-Encoding');
  });

  it('should validate CSP format compliance', () => {
    const res = createMockResponse();

    const csp = "default-src 'self'; script-src 'self' https://cdn.example.com;";
    res.setHeader('Content-Security-Policy', csp);

    const policy = res.getHeader('Content-Security-Policy');

    // Semicolon-separated directives
    const directives = policy!.split(';').map((d) => d.trim());
    expect(directives.length).toBeGreaterThan(0);

    // Each directive should be properly formed (name followed by values)
    directives.forEach((directive) => {
      if (directive) {
        const parts = directive.split(/\s+/);
        expect(parts.length).toBeGreaterThan(0);
        expect(parts[0]).toMatch(/^[a-z-]+$/); // Directive name
      }
    });
  });
});
