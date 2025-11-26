# Security Policy

## Overview

Family Activity Finder implements enterprise-grade security measures to protect user data and prevent API abuse. This document outlines the security features, configurations, and best practices.

## Security Features Implemented

### 🔴 Critical Security Measures

#### 1. CORS (Cross-Origin Resource Sharing)
- **Protection:** Prevents unauthorized domains from accessing the API
- **Configuration:** Restricted to frontend origin only
- **Location:** `backend/src/index.ts:25-28`
- **Default:** `http://localhost:5173` (configurable via `FRONTEND_URL` environment variable)

#### 2. Rate Limiting
- **Protection:** Prevents API abuse and excessive Claude API costs
- **Limit:** 10 requests per 15 minutes per IP address
- **Response:** HTTP 429 (Too Many Requests) when limit exceeded
- **Location:** `backend/src/index.ts:14-32`
- **Headers:** Returns `RateLimit-*` headers for client awareness

#### 3. Request Size Limits
- **Protection:** Prevents memory exhaustion attacks
- **Limit:** 10KB maximum payload size
- **Response:** HTTP 413 (Payload Too Large) for oversized requests
- **Location:** `backend/src/index.ts:29`

#### 4. Comprehensive Input Validation
- **Protection:** Prevents SQL injection, XSS, and prompt injection attacks
- **Location:** `backend/src/routes/recommend.ts:178-292`
- **Validation Rules:**
  - **City:** 1-100 characters, letters/spaces/hyphens/apostrophes/periods only
  - **State:** Valid US state code (50 states + DC)
  - **ZipCode:** 5 digits or empty (optional)
  - **Ages:** Integers 0-18, maximum 10 children
  - **Date:** YYYY-MM-DD format, within 1 year from today
  - **TimeSlot:** Whitelist validation (all_day, morning, afternoon, evening, night)
  - **Distance:** 1-50 miles
  - **Preferences:** Maximum 500 characters (optional)

### 🟠 High Priority Security

#### 5. Security Headers (Helmet)
- **Protection:** Mitigates common web vulnerabilities
- **Headers Enabled:**
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options (prevents clickjacking)
  - X-Content-Type-Options (prevents MIME sniffing)
  - X-DNS-Prefetch-Control
  - X-Download-Options
  - X-Permitted-Cross-Domain-Policies
  - X-XSS-Protection
- **Location:** `backend/src/index.ts:24`

#### 6. Error Response Sanitization
- **Protection:** Prevents information disclosure
- **Implementation:** All error messages are user-friendly and generic
- **Logging:** Detailed errors logged server-side only
- **Location:** `backend/src/routes/recommend.ts:240-267`

## Environment Variables

### Required Environment Variables

#### Backend (.env)
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...           # Your Anthropic API key

# Optional (with defaults)
PORT=3001                              # Server port
FRONTEND_URL=http://localhost:5173     # Frontend origin for CORS
```

#### Frontend (.env)
```bash
# Optional (with defaults)
VITE_API_URL=http://localhost:3001    # Backend API URL
```

### Production Environment Variables

For production deployment, ensure the following:

```bash
# Backend Production
ANTHROPIC_API_KEY=sk-ant-...           # Production API key
PORT=3001                              # Server port (or dynamic from hosting)
FRONTEND_URL=https://yourdomain.com    # Production frontend URL
NODE_ENV=production                    # Environment mode
```

```bash
# Frontend Production
VITE_API_URL=https://api.yourdomain.com  # Production backend URL
```

## Security Testing Results

All security features have been tested and verified:

✅ **CORS Testing**
- Unauthorized origins (evil-site.com) blocked
- Authorized origin (localhost:5173) allowed

✅ **Rate Limiting Testing**
- 10 requests succeed (HTTP 200)
- 11th+ requests blocked (HTTP 429)
- Rate limit headers present in all responses

✅ **Request Size Testing**
- Normal requests (< 10KB) accepted
- Oversized requests (15KB) rejected with HTTP 413

✅ **Input Validation Testing**
- SQL injection attempts blocked ("Dublin; DROP TABLE users--")
- Invalid state codes rejected ("ZZ")
- Age range violations blocked (-5, 25)
- Invalid date formats rejected
- XSS attempts sanitized

✅ **Security Headers Testing**
- All 8 Helmet headers verified present
- CSP, HSTS, X-Frame-Options confirmed active

✅ **Error Response Testing**
- No internal details exposed to clients
- No stack traces in responses
- No raw API responses leaked

✅ **npm Audit**
- Backend: 0 vulnerabilities
- Frontend: 0 vulnerabilities

## API Key Security

### ✅ Best Practices Implemented

1. **Server-Side Only:** API keys stored in backend `.env` file only
2. **Never Exposed:** No API keys in frontend code or git history
3. **Environment Variables:** All sensitive data in `.env` files
4. **Git Ignored:** `.env` files in `.gitignore`
5. **Template Files:** `.env.example` files provided without real keys

### ❌ What NOT to Do

- Never commit `.env` files to git
- Never hardcode API keys in source code
- Never expose API keys in frontend JavaScript
- Never share API keys in public repositories
- Never use production keys in development

## Rate Limiting Details

### Current Limits

- **Window:** 15 minutes (900 seconds)
- **Max Requests:** 10 per IP address
- **Reset:** Automatic after window expires
- **Headers:**
  - `RateLimit-Policy: 10;w=900`
  - `RateLimit-Limit: 10`
  - `RateLimit-Remaining: X` (decrements with each request)
  - `RateLimit-Reset: X` (seconds until reset)

### Client Handling

If you receive HTTP 429, wait for the time specified in `RateLimit-Reset` header before retrying.

## CORS Configuration

### Allowed Origins

- **Development:** `http://localhost:5173` (default)
- **Production:** Set via `FRONTEND_URL` environment variable

### Credentials

- **Enabled:** `credentials: true` for future authentication support

### Blocked Origins

All origins not explicitly allowed will receive CORS errors.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer directly with details
3. Allow reasonable time for a fix before public disclosure
4. Include steps to reproduce the vulnerability

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Security Checklist for Contributors

Before submitting a pull request:

- [ ] No API keys or secrets in code
- [ ] All inputs validated and sanitized
- [ ] No console.log statements with sensitive data
- [ ] `.env` files not committed
- [ ] Dependencies have no known vulnerabilities (`npm audit`)
- [ ] New endpoints have rate limiting
- [ ] Error messages don't leak internal details
- [ ] CORS configuration reviewed

## Security Updates

Security features are actively maintained. Run `npm audit` regularly:

```bash
# Check for vulnerabilities
cd backend && npm audit
cd frontend && npm audit

# Fix vulnerabilities automatically (when safe)
npm audit fix
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Anthropic API Security](https://docs.anthropic.com/en/api/security)

---

**Last Updated:** 2025-11-15
**Security Version:** 1.0.0
**Status:** ✅ Production Ready
