# Family Activity Finder - Technical Architecture & Patterns

This document captures key architectural decisions, patterns, and technical insights from building the Family Activity Finder project. Use this as a reference for understanding the codebase structure and design decisions.

## Project Overview

**Family Activity Finder** is a full-stack TypeScript application that helps parents discover family-friendly activities using AI-powered web search. The project demonstrates modern web development practices including multi-provider AI integration, security hardening, and production-ready architecture.

---

## Key Architectural Patterns

### 1. Factory Pattern for Multi-Provider Support

**Location:** `backend/src/services/llm-providers/factory.ts`

**Why:** The factory pattern allows us to support multiple AI providers (Anthropic Claude, Perplexity, Google Gemini) with a unified interface. This makes it easy to:

- Add new providers without changing existing code
- Switch providers dynamically based on availability
- Maintain consistent error handling across providers

**Implementation:**
```typescript
// All providers implement the same LLMProvider interface
export function createProvider(provider: LLMProviderType): LLMProvider {
  switch (provider) {
    case 'anthropic': return new AnthropicProvider();
    case 'perplexity': return new PerplexityProvider();
    case 'gemini': return new GeminiProvider();
  }
}
```

**Benefits:**

- **Extensibility:** Adding a new provider only requires creating a new class implementing `LLMProvider`
- **Type Safety:** TypeScript ensures all providers implement required methods
- **Testability:** Easy to mock providers for testing

---

### 2. Shared Types Between Frontend and Backend

**Location:** `backend/src/shared/types/index.ts` (imported by frontend)

**Why:** Maintaining a single source of truth for types prevents type mismatches and ensures frontend/backend stay in sync.

**Pattern:**

- Backend defines types in `shared/types/`
- Frontend imports directly from backend: `import type { Recommendation } from '../../../backend/src/shared/types'`
- This ensures type consistency across the entire application

**Key Types:**

- `ActivityFormData` - Form input structure
- `Recommendation` - Activity recommendation structure
- `MultiProviderResponse` - Parallel query response format
- `LLMProvider` - Provider identifier type

---

### 3. Consistent Prompt Template Across Providers

**Location:** All provider files (`AnthropicProvider.ts`, `PerplexityProvider.ts`, `GeminiProvider.ts`)

**Why:** Using the same prompt template ensures consistent output format regardless of which AI provider is used. This allows:

- Unified parsing logic
- Consistent recommendation quality
- Easier prompt iteration (change once, affects all providers)

**Key Elements:**

- Location formatting: `${city}, ${state} ${zipCode || ''}`
- Date formatting: Human-readable format (e.g., "Saturday, November 16, 2025")
- Time slot labels: Consistent mapping (all_day → "All Day")
- Output format: Markdown with emoji, title, location, distance, description

---

### 4. Security-First Error Handling

**Location:** `backend/src/shared/utils/sanitize.ts`

**Why:** Error messages can leak sensitive information (API keys, file paths, stack traces). We sanitize all errors before sending to clients.

**Key Functions:**

- `sanitizeForPrompt()` - Prevents prompt injection attacks
- `sanitizeErrorMessage()` - Removes sensitive data from error messages

**Security Measures:**

- Remove file paths: `/path/to/file` → `[path]`
- Remove API keys: `API_KEY` → `[API_KEY]`
- Remove stack traces (unless DEBUG_LOGGING=true)
- Limit error message length (200 chars)

---

### 5. Parallel Query Pattern with Fault Tolerance

**Location:** `backend/src/routes/recommend.ts` - `/api/recommend/all` endpoint

**Why:** When querying multiple providers, we want all providers to be queried even if some fail. This provides better UX and allows comparison.

**Implementation:**
```typescript
// Use Promise.allSettled instead of Promise.all
const results = await Promise.allSettled(
  availableProviders.map(async (providerId) => {
    // Individual provider logic with try-catch
    // Returns success or error object
  })
);
```

**Benefits:**

- Individual provider failures don't break entire request
- Users can compare results from successful providers
- Better error isolation and debugging

---

### 6. Input Validation Layer

**Location:** `backend/src/shared/validators/`

**Why:** Comprehensive validation prevents invalid data from reaching AI providers, saving API costs and improving error messages.

**Validation Strategy:**

- **Location:** City (regex), State (enum), ZipCode (5 digits)
- **Ages:** Array of integers 0-18, max 10 children
- **Date:** YYYY-MM-DD format, within 1 year range
- **TimeSlot:** Enum validation
- **Distance:** Number 1-50 miles
- **Preferences:** Max 500 characters, sanitized for prompt injection

**Pattern:** Each validator returns `string | null` (error message or null if valid)

---

### 7. Environment-Based Configuration

**Location:** All provider classes and `backend/src/routes/recommend.ts`

**Why:** Different environments (dev, staging, production) need different configurations. Environment variables provide flexibility.

**Key Configurations:**

- **API Keys:** Provider-specific keys (required)
- **Model Names:** Configurable per provider (ANTHROPIC_API_MODEL, etc.)
- **Display Names:** User-friendly names (ANTHROPIC_MODEL_NAME, etc.)
- **Output Format:** Markdown or JSON (OUTPUT_FORMAT)
- **Debug Logging:** Verbose logging flag (DEBUG_LOGGING)

**Pattern:** Always provide sensible defaults, validate env vars on initialization

---

### 8. Timeout Pattern for Long-Running Operations

**Location:** `backend/src/shared/utils/timeout.ts`

**Why:** AI API calls can hang indefinitely. Timeouts prevent the server from blocking and provide better UX.

**Implementation:**
```typescript
const recommendations = await withTimeout(
  provider.generateRecommendations(formData, options),
  60000, // 60 second timeout
  'Request timed out after 60 seconds'
);
```

**Benefits:**

- Prevents server resource exhaustion
- Provides clear timeout error messages
- Configurable per operation

---

### 9. Type-Safe API Communication

**Location:** `frontend/src/services/api.ts` and `backend/src/routes/recommend.ts`

**Why:** TypeScript types ensure frontend and backend agree on request/response shapes.

**Pattern:**

- Frontend defines API functions with typed parameters
- Backend validates request body matches `ActivityFormData` type
- Response types ensure frontend receives expected structure
- Type errors catch mismatches at compile time

---

### 10. Component Composition Pattern

**Location:** `frontend/src/components/`

**Why:** Breaking UI into small, focused components improves maintainability and reusability.

**Component Hierarchy:**

- `App.tsx` - Main orchestrator, manages state
- `ActivityForm.tsx` - Form input collection
- `RecommendationCard.tsx` - Single recommendation display
- `MultiProviderResults.tsx` - Tabbed multi-provider results

**Benefits:**

- Each component has single responsibility
- Easy to test components in isolation
- Reusable across different contexts

---

## Security Architecture

### Defense in Depth Strategy

1. **Input Validation** - Validate all inputs before processing
2. **Prompt Sanitization** - Prevent prompt injection attacks
3. **Error Sanitization** - Never expose internal details
4. **Rate Limiting** - Prevent API abuse (10 requests per 15 minutes)
5. **Request Size Limits** - Prevent memory exhaustion (10KB max)
6. **CORS Protection** - Restrict API access to authorized origins
7. **Security Headers** - Helmet.js adds 8 security headers
8. **API Key Protection** - Keys stored server-side only, never in frontend

---

## Performance Optimizations

1. **Parallel Queries** - Query multiple providers simultaneously using `Promise.allSettled`
2. **Timeout Management** - 60-second timeouts prevent hanging requests
3. **Efficient Parsing** - Regex-based parsing for fast recommendation extraction
4. **Minimal Re-renders** - React state management prevents unnecessary updates
5. **Lazy Loading** - Frontend only loads what's needed

---

## Error Handling Strategy

### Three-Layer Error Handling

1. **Validation Layer** - Catch invalid inputs early (400 errors)
2. **Provider Layer** - Handle provider-specific errors (API failures, timeouts)
3. **Application Layer** - Generic error handling with sanitization (500 errors)

### Error Flow

```text
User Input → Validation → Provider API → Parsing → Response
     ↓           ↓            ↓            ↓          ↓
   Invalid   400 Error   API Error   Parse Error  Success
```

---

## Code Organization Principles

1. **Separation of Concerns** - Routes, services, validators, utils are separate
2. **Shared Code** - Common types and utilities in `shared/` directory
3. **Provider Isolation** - Each provider is self-contained in its own file
4. **Type Safety** - TypeScript types guide architecture decisions
5. **Documentation** - JSDoc comments explain complex logic

---

## Testing Strategy

**Current Approach:** Manual testing with real API calls

- End-to-end flow testing
- Error case testing (invalid inputs, API failures)
- Multi-provider testing
- Security testing (CORS, rate limiting, input validation)

**Future Enhancements:**

- Unit tests for validators and utilities
- Integration tests for API endpoints
- Mock provider implementations for faster testing

---

## Deployment Considerations

1. **Environment Variables** - All sensitive config via env vars
2. **Build Process** - TypeScript compilation to JavaScript
3. **CORS Configuration** - Production frontend URL in env
4. **Rate Limiting** - Prevents abuse in production
5. **Error Logging** - Server-side logging for debugging (not exposed to clients)

---

## Key Learnings & Best Practices

1. **Factory Pattern** - Essential for multi-provider architecture
2. **Type Safety** - Shared types prevent frontend/backend mismatches
3. **Security First** - Always sanitize user input and error messages
4. **Fault Tolerance** - Use `Promise.allSettled` for parallel operations
5. **Consistent Prompts** - Same prompt template across providers simplifies parsing
6. **Environment Config** - Make everything configurable via env vars
7. **Timeout Everything** - Long-running operations need timeouts
8. **Validation Early** - Validate inputs before expensive API calls

---

## Future Architecture Considerations

- **Website URLs Feature** - Will require prompt updates, parsing enhancements, URL validation
- **Caching Layer** - Could cache recommendations for common queries
- **Database** - Could store user preferences, search history
- **Authentication** - Could add user accounts for saved searches
- **Rate Limiting Per User** - Currently per IP, could be per authenticated user

---

## Questions to Consider When Adding Features

1. **Does it affect all providers?** - If yes, update factory pattern and shared types
2. **Does it need validation?** - Add validator in `shared/validators/`
3. **Does it expose sensitive data?** - Ensure error sanitization
4. **Does it need timeout?** - Wrap in `withTimeout()` utility
5. **Does it need environment config?** - Add to `.env.example` and document

---

**Last Updated:** November 2025
**Project Status:** Production-ready with multi-provider support
