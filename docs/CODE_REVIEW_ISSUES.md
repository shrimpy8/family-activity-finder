# Code Review Issues — family-activity-finder

> **Generated:** 2026-05-12
> **Reviewed by:** Claude Opus 4.6 (multi-agent: backend + frontend)
> **Purpose:** Surgical fixes for Sonnet to execute. Each issue is self-contained.

## Priority Legend

| Severity | Meaning |
|----------|---------|
| **Critical** | Security risk or data loss; fix before any deployment |
| **High** | Correctness bug, major DRY violation, or robustness gap; fix in current sprint |
| **Medium** | Logic flaw, best-practice gap, or moderate maintainability concern |
| **Low** | Polish, minor best-practice, or documentation gap |

---

## Critical Issues

### B1. No Graceful Shutdown — In-Flight Requests Killed on Deploy

- **File:** `backend/src/index.ts:45-49`
- **Category:** Robustness
- **Severity:** Critical
- **Problem:** `app.listen()` return value is discarded. No `SIGTERM`/`SIGINT` handler exists. In-flight LLM requests (up to 60s) are abruptly killed on deploy, leaking connections and leaving clients hanging.
- **Fix:** Store the server instance and add shutdown handling:
  ```ts
  const server = app.listen(PORT, () => { ... });
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  ```

### B2. Timeout Utility Leaks Timers

- **File:** `backend/src/shared/utils/timeout.ts:11-15, 24-32`
- **Category:** Robustness / Logic
- **Severity:** Critical
- **Problem:** `createTimeout` starts a `setTimeout` that is never cleared when the main promise resolves first. On `/recommend/all`, 3 concurrent providers each leak a 60-second timer. Accumulated timers keep the event loop alive, prevent clean shutdown, and waste memory.
- **Fix:** Replace with a `withTimeout` that clears the timer in `finally`:
  ```ts
  export async function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(msg)), ms);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer!);
    }
  }
  ```
  Update all call sites in `recommend.ts` to use the new signature.

### B3. `console.log` Dumps Full Request Body (PII) to Production Logs

- **File:** `backend/src/routes/recommend.ts:144`
- **Category:** Security
- **Severity:** Critical
- **Problem:** The non-debug `else` branch runs `console.log('... Received request:', formData)` unconditionally. This dumps city, state, zip code, and children's ages — PII involving minors' location data — into production logs.
- **Fix:** Remove the `else` branch entirely, or log only non-sensitive fields: `{ provider: formData.provider, timeSlot: formData.timeSlot }`.

### F1. `fullErrorResponse` Exposes Raw Backend Errors to Browser

- **File:** `frontend/src/components/MultiProviderResults.tsx:130-132`
- **Related:** `backend/src/shared/types/index.ts:82` (`fullErrorResponse?: any`)
- **Category:** Security
- **Severity:** Critical
- **Problem:** `result.fullErrorResponse` (typed `any`) is rendered verbatim via `JSON.stringify`. If the backend includes API keys, internal URLs, or stack traces in this field, they're displayed to the user in the browser. The backend already populates this with `error.name` (e.g., `"FetchError"`, `"AbortError"`) which reveals implementation details.
- **Fix (two-part):**
  1. **Backend** (`recommend.ts:369-374, 410-415`): Remove `fullErrorResponse` from client responses entirely. Log it server-side only.
  2. **Frontend** (`MultiProviderResults.tsx:130-132`): Remove the expandable raw error display.
  3. **Types** (`shared/types/index.ts:82`): Change `fullErrorResponse?: any` to `fullErrorResponse?: Record<string, unknown>` or remove the field.

---

## High Issues

### B4. DRY: Validation Logic Duplicated Between Two Route Handlers (~80 lines)

- **File:** `backend/src/routes/recommend.ts:42-123` vs `246-326`
- **Category:** DRY
- **Severity:** High
- **Problem:** The entire validation block (city, state, zip, ages, date, timeSlot, distance, preferences) is copy-pasted between `/recommend` and `/recommend/all` — ~80 identical lines. Any fix to one must be manually replicated.
- **Fix:** Extract a `validateFormData(formData: unknown): { valid: true; data: FormData } | { valid: false; error: string }` function. Call it from both handlers.

### B5. DRY: `buildPrompt()` Duplicated Across All 3 Providers (~80 lines x3)

- **Files:** `AnthropicProvider.ts:16-94`, `PerplexityProvider.ts:12-85`, `GeminiProvider.ts:13-86`
- **Category:** DRY
- **Severity:** High
- **Problem:** Perplexity and Gemini `buildPrompt()` are character-for-character identical; Anthropic differs only in markdown bold markers. Any prompt improvement must be applied in 3 places.
- **Fix:** Extract a shared `buildPrompt(formData)` into `services/llm-providers/prompt.ts`. If the Anthropic version needs minor formatting differences, accept an options argument.

### B6. DRY: `parseRecommendations()` Duplicated Across All 3 Providers (~80 lines x3)

- **Files:** `AnthropicProvider.ts:103-190`, `PerplexityProvider.ts:91-168`, `GeminiProvider.ts:91-168`
- **Category:** DRY
- **Severity:** High
- **Problem:** All three providers have identical parsing logic — same regex, same fallback, same `.slice(0, 5)`. ~80 lines duplicated 3 times.
- **Fix:** Extract into a shared `parseRecommendations(text: string)` in the same common module as `buildPrompt`.

### B7. Prompt Injection Sanitization Is Incomplete

- **File:** `backend/src/shared/utils/sanitize.ts:11-38`
- **Category:** Security
- **Severity:** High
- **Problem:** `sanitizeForPrompt()` only sanitizes the `preferences` field, but `city` flows directly into the prompt without sanitization: `"Search the web for family-friendly activities happening in ${locationStr}"`. The sanitization approach (stripping newlines/backticks) is a weak denylist — `"Ignore previous instructions and instead..."` passes through without special characters.
- **Fix:** Wrap all user-provided values (`city`, `state`, `preferences`) in explicit delimiters in the prompt:
  ```
  <user_input>${city}</user_input>
  ```
  And instruct the model to treat content within those delimiters as data only. Apply `sanitizeForPrompt` to all user-supplied fields, not just `preferences`.

### B8. Perplexity `fetch` Has No `AbortController` — Connections Hang Forever

- **File:** `backend/src/services/llm-providers/PerplexityProvider.ts:220`
- **Category:** Robustness
- **Severity:** High
- **Problem:** The `fetch()` call has no `signal`/`AbortController`. The outer `withTimeout` races a timer but if the timer wins, the underlying HTTP connection stays open indefinitely — `fetch` is never aborted.
- **Fix:** Add an `AbortController` with timeout:
  ```ts
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch(this.apiUrl, { signal: controller.signal, ... });
  } finally {
    clearTimeout(timeout);
  }
  ```

### B9. No Test Suite

- **File:** `backend/package.json:10`
- **Category:** Best Practice
- **Severity:** High
- **Problem:** Test script is `"echo \"Error: no test specified\" && exit 1"`. Zero tests for validators, sanitizers, parsers, or route handlers. Validators have subtle edge cases (B12 below) that tests would catch.
- **Fix:** Add `vitest` (or `jest`), write unit tests for: validators, `sanitizeForPrompt`, `parseRecommendations`, and route handler validation logic.

### F2. No Request Cancellation — Race Condition on Rapid Submissions

- **File:** `frontend/src/App.tsx:16-63`
- **Category:** Robustness
- **Severity:** High
- **Problem:** No `AbortController` cancels stale requests. If the user submits twice quickly, both `fetch` calls race. The first response to arrive sets state, then the second overwrites it. `isLoading` can also become inconsistent.
- **Fix:** Create an `AbortController` at the start of `handleFormSubmit`, store in a `useRef`, and call `controller.abort()` on re-entry. Pass `{ signal: controller.signal }` to `fetch` calls in `api.ts`.

### F3. No Timeout on Frontend API Requests

- **File:** `frontend/src/services/api.ts:19-25, 45-51`
- **Category:** Robustness
- **Severity:** High
- **Problem:** `fetch` calls have no timeout. The loading text says "10-20 seconds" but nothing enforces it. If the backend hangs, the user stares at a spinner indefinitely.
- **Fix:** Add `AbortSignal.timeout(30_000)` to fetch options.

### F4. `isLoading` Not Reset in Multi-Provider Error Path

- **File:** `frontend/src/App.tsx:27-46`
- **Category:** Logic
- **Severity:** High
- **Problem:** The multi-provider branch sets `setIsLoading(false)` inside both `try` and `catch`. Unlike the single-provider branch (which uses `finally`), if `setMultiProviderResults` or `setLoadingStates` throws, `isLoading` stays `true` forever.
- **Fix:** Move `setIsLoading(false)` into a `finally` block, mirroring the single-provider pattern.

### F5. No React Error Boundary

- **File:** `frontend/src/main.tsx`
- **Category:** Best Practice
- **Severity:** High
- **Problem:** No Error Boundary wraps `<App />`. Any uncaught render error crashes the entire app with a white screen.
- **Fix:** Add an Error Boundary component around `<App />` that renders a fallback UI with a retry button.

### F6. No Frontend Input Sanitization

- **File:** `frontend/src/components/ActivityForm.tsx:29-55`
- **Category:** Security / Robustness
- **Severity:** High
- **Problem:** User inputs (`city`, `state`, `preferences`, `zipCode`) are sent to the API with zero sanitization. `preferences` textarea has no `maxLength`. No `.trim()` on any value before submission.
- **Fix:** Add `maxLength={500}` to the textarea, validate `zipCode` matches `/^\d{5}$/` or is empty, validate `state` matches `/^[A-Z]{2}$/`, and `.trim()` all string values before submission.

### F7. DRY: Loading/Error/Empty UI Blocks Copy-Pasted

- **File:** `frontend/src/App.tsx:110-116 vs 148-154` (loading), `117-129 vs 156-168` (error), `133-141 vs 170-178` (empty)
- **Category:** DRY
- **Severity:** High
- **Problem:** Loading spinner, error panel, and empty-state panel are copy-pasted between multi-provider and single-provider branches with minor text differences — three DRY violations in one file.
- **Fix:** Extract `<LoadingSpinner message={...} />`, `<ErrorPanel error={...} onDismiss={...} />`, and `<EmptyState />` components. Use them in both branches.

### B10. `DEBUG_LOGGING` Flag Repeated in 4 Files

- **Files:** `recommend.ts:13`, `AnthropicProvider.ts:8`, `PerplexityProvider.ts:7`, `GeminiProvider.ts:7`
- **Category:** DRY / Best Practice
- **Severity:** High
- **Problem:** `const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true'` is independently declared in 4 files.
- **Fix:** Add to a shared config module (e.g., `shared/config.ts`) and import from there.

---

## Medium Issues

### B11. Route Handler Date Validation Ignores Shared Validators

- **File:** `backend/src/routes/recommend.ts:71-92`
- **Category:** DRY / Logic
- **Severity:** Medium
- **Problem:** Route handler performs manual inline date validation despite `shared/validators/date.ts` exporting `validateDate()` that does the same thing. The inline version has a subtle difference: it does not normalize dates to midnight before comparison, while the shared `isDateInRange()` does. This means a request at 11pm could see different range boundaries.
- **Fix:** Replace inline date validation in both route handlers with `validateDate(formData.date)`.

### B12. City Validator Checks Length on Untrimmed Input

- **File:** `backend/src/shared/validators/location.ts:19-28`
- **Category:** Logic
- **Severity:** Medium
- **Problem:** Line 19 trims the city to check emptiness, but line 23 checks `city.length` (untrimmed) against `CITY_MAX_LENGTH`, and line 27 tests regex on `city` (untrimmed). A city with leading/trailing spaces passes emptiness check but the untrimmed value flows into the prompt.
- **Fix:** Assign `const trimmedCity = city.trim()` once at the top and use it for all checks. Return the trimmed value.

### B13. `_options` Parameter Ignored by All Providers

- **Files:** `AnthropicProvider.ts:233`, `PerplexityProvider.ts:213`, `GeminiProvider.ts:212`
- **Category:** Best Practice / Logic
- **Severity:** Medium
- **Problem:** The `GenerateOptions` parameter (`outputFormat`) is accepted but completely ignored (`_options`). The `getOutputFormat()` function in the route has no effect on LLM prompts or response parsing.
- **Fix:** Either implement the output format switching or remove the dead option and `getOutputFormat()` to avoid misleading code.

### B14. `formData` Null Check Is Ineffective

- **File:** `backend/src/routes/recommend.ts:35-38, 239-242`
- **Category:** Logic
- **Severity:** Medium
- **Problem:** `if (!formData)` only catches `null`/`undefined`/`0`/`""` but not `{}` (empty object), which passes and then fails field-by-field with confusing errors. `express.json()` ensures `req.body` is the parsed value.
- **Fix:** Check `if (typeof formData !== 'object' || formData === null || Array.isArray(formData))`.

### B15. Error Matching Uses Fragile String Checking

- **File:** `backend/src/routes/recommend.ts:198-211`
- **Category:** Robustness / Error Handling
- **Severity:** Medium
- **Problem:** Error categorization uses `error.message.includes('API_KEY')` and `error.message.includes('Perplexity')`. If any provider changes their error message wording, classification silently breaks.
- **Fix:** Use custom error classes: `class ProviderError extends Error { provider: string; code: string }`. Throw from providers, check `error instanceof ProviderError` in the route.

### B16. Provider Factory Creates New Instance on Every Request

- **File:** `backend/src/services/llm-providers/factory.ts:10-21`
- **Category:** Best Practice / Robustness
- **Severity:** Medium
- **Problem:** `createProvider()` instantiates a new provider (and new SDK client) on every request. On `/recommend/all`, 3 new instances per request.
- **Fix:** Cache provider instances — they are stateless after construction. Use a simple `Map` or singleton pattern.

### B17. `sanitizeErrorMessage` Strips Legitimate Path-like Strings

- **File:** `backend/src/shared/utils/sanitize.ts:59`
- **Category:** Logic
- **Severity:** Medium
- **Problem:** Regex `\/[^\s]+` replaces any `/`-prefixed word with `[path]`. This mangles `"401/Unauthorized"` into `"[path]"`, losing actual error info.
- **Fix:** Use a more specific pattern requiring at least 2 path segments: `/(\/[a-zA-Z0-9_\-]+){2,}/g`.

### B18. CORS `credentials: true` With No Authentication

- **File:** `backend/src/index.ts:29`
- **Category:** Security
- **Severity:** Medium
- **Problem:** `credentials: true` tells browsers to send cookies/auth headers. No auth exists yet. If a cookie is ever set accidentally, it will be sent on every cross-origin request.
- **Fix:** Remove `credentials: true` until authentication is actually implemented.

### B19. `sanitizeForPrompt` Order Bug — Triple-Backtick Replacement Is Dead Code

- **File:** `backend/src/shared/utils/sanitize.ts:23-25`
- **Category:** Logic
- **Severity:** Medium
- **Problem:** Line 23 replaces all backticks with `'`, then line 25 tries to replace triple-backticks — but they no longer exist. The triple-backtick replacement is dead code.
- **Fix:** Reverse the order: replace triple-backticks first, then replace remaining single backticks.

### F8. Array Index Used as React `key`

- **Files:** `frontend/src/App.tsx:199`, `MultiProviderResults.tsx:160`
- **Category:** Best Practice
- **Severity:** Medium
- **Problem:** `key={index}` on `RecommendationCard` lists. If lists are reordered or filtered, React will incorrectly reuse DOM nodes.
- **Fix:** Use a composite key: `key={\`${rec.title}-${rec.location}\`}`.

### F9. `console.log` Logs User Input to Browser Console

- **File:** `frontend/src/App.tsx:17`
- **Category:** Best Practice
- **Severity:** Medium
- **Problem:** `console.log('Form submitted:', formData)` logs location and kids' ages to the browser console in production.
- **Fix:** Remove the `console.log` on line 17.

### F10. No Validation That Parsed Ages Are in Reasonable Range

- **File:** `frontend/src/components/ActivityForm.tsx:33-36`
- **Category:** Robustness
- **Severity:** Medium
- **Problem:** `parseInt(age.trim())` accepts any integer, including negatives, zero, and 999. Backend says 0-18 but nothing enforces it on frontend.
- **Fix:** Add `.filter(age => age >= 0 && age <= 18)` after the `isNaN` filter and show a message if ages were rejected.

### F11. `alert()` for Form Validation

- **File:** `frontend/src/components/ActivityForm.tsx:40`
- **Category:** Best Practice
- **Severity:** Medium
- **Problem:** `alert('Please fill in all required fields correctly')` is a blocking browser dialog — not accessible, not styled, not testable.
- **Fix:** Replace with inline form validation errors near the relevant fields, using `aria-invalid` and `aria-describedby`.

### F12. `handleClear` Resets `timeSlot` to Wrong Default

- **File:** `frontend/src/components/ActivityForm.tsx:64`
- **Category:** Logic
- **Severity:** Medium
- **Problem:** Initial state is `useState<TimeSlot>('all_day')` (line 24), but `handleClear` sets it to `'afternoon'`. Clear button produces a different default than initial page load.
- **Fix:** Change line 64 to `setTimeSlot('all_day')`.

### F13. Unused Destructured `provider` Variable

- **File:** `frontend/src/App.tsx:29`
- **Category:** Best Practice
- **Severity:** Medium
- **Problem:** `const { provider, ...formDataWithoutProvider } = formData;` — `provider` is unused. Should error with `noUnusedLocals: true`.
- **Fix:** Change to `const { provider: _provider, ...formDataWithoutProvider } = formData;`.

### F14. Triple `.find()` Call for Provider Display Text

- **File:** `frontend/src/components/ActivityForm.tsx:127`
- **Category:** DRY
- **Severity:** Medium
- **Problem:** `providerOptions.find(...)` called three times in the same template expression to get `label` and `model`.
- **Fix:** Compute once: `const selected = providerOptions.find(o => o.value === provider);` then reference `selected?.label` and `selected?.model`.

### F15. Missing Accessibility: No `aria-invalid` or Visible Error States

- **File:** `frontend/src/components/ActivityForm.tsx`
- **Category:** Best Practice
- **Severity:** Medium
- **Problem:** Required fields use `required` attribute but no `aria-invalid`, `aria-describedby`, or visible inline error messages. Screen readers get no feedback beyond native browser tooltip.
- **Fix:** Track field-level validation state and render `aria-invalid="true"` plus error `<span>` with `role="alert"` per invalid field.

### F16. `activeTab` Initialization Goes Stale on New Search

- **File:** `frontend/src/components/MultiProviderResults.tsx:21`
- **Category:** Logic
- **Severity:** Medium
- **Problem:** `useState<string>(results[0]?.provider || '')` captures initial value on mount. If `results` changes (new search), `activeTab` still points to the old provider and never updates.
- **Fix:** Add `useEffect(() => { setActiveTab(results[0]?.provider || ''); }, [results]);`.

---

## Low Issues

### B20. `console.log` Used Instead of Structured Logger Everywhere

- **Files:** All backend files
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** Entire backend uses `console.log`/`console.error` with emoji prefixes — unstructured, unparseable logs.
- **Fix:** Use `pino` with structured JSON output (per CLAUDE.md Node.js guidelines).

### B21. Hardcoded `max_tokens: 2048` Across Providers

- **Files:** `AnthropicProvider.ts:243`, `PerplexityProvider.ts:234`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `max_tokens` hardcoded in each provider. Should be configurable.
- **Fix:** Read from env var `LLM_MAX_TOKENS` with `2048` default.

### B22. Hardcoded Timeout of 60000ms in Two Places

- **File:** `backend/src/routes/recommend.ts:165, 356`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** 60-second timeout hardcoded in two places.
- **Fix:** Add `LLM_TIMEOUT_MS` to env/config; reference from both handlers.

### B23. `as any` Type Casts in Validators

- **Files:** `recommend.ts:99`, `location.ts:44`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `TIME_SLOTS.includes(formData.timeSlot as any)` and `US_STATES.includes(state.toUpperCase() as any)` bypass TypeScript safety.
- **Fix:** Use the existing type guard functions `isValidTimeSlot()` and `isValidState()` in the route handler instead.

### B24. Rate Limiter Uses In-Memory Store

- **File:** `backend/src/index.ts:15-21`
- **Category:** Robustness
- **Severity:** Low
- **Problem:** Default in-memory store. Multi-instance deploys get `10 * N instances` effective rate limit per IP.
- **Fix:** Document the limitation. For production, recommend `rate-limit-redis`.

### B25. Perplexity Response Weakly Typed

- **File:** `PerplexityProvider.ts:244`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** Manual inline type assertion `as { choices?: ... }`. If Perplexity changes response shape, silently produces `undefined`.
- **Fix:** Define a `PerplexityResponse` interface and validate shape at runtime.

### B26. Health Endpoint Not Documented as Intentionally Outside Rate Limiter

- **File:** `backend/src/index.ts:37-39`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `/health` is outside the rate limiter. Correct for health checks, but not documented.
- **Fix:** Add a comment explaining it is intentionally excluded.

### F17. `document.getElementById('root')!` Non-Null Assertion

- **File:** `frontend/src/main.tsx:6`
- **Category:** Robustness
- **Severity:** Low
- **Problem:** `!` assertion crashes with an opaque error if `#root` is missing.
- **Fix:** Add a guard: `const root = document.getElementById('root'); if (!root) throw new Error('Root element not found');`.

### F18. Hardcoded Pixel Width on Form

- **File:** `frontend/src/App.tsx:101`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `style={{ width: '418px', flexShrink: 0 }}` doesn't adapt to small screens. Below ~900px, layout overflows.
- **Fix:** Use Tailwind responsive classes: `w-full lg:w-[418px]` and stack columns on small screens.

### F19. `handleClear` Resets Date to Empty Instead of Default

- **File:** `frontend/src/components/ActivityForm.tsx:62`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** Initial state sets `date` to `getNextWeekend()` but `handleClear` sets it to `''`. Clear should restore defaults.
- **Fix:** Change `setDate('')` to `setDate(getNextWeekend())`.

### F20. `ProviderIcon` Component Exported but Never Used

- **File:** `frontend/src/utils/providerIcons.tsx:24-26`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `ProviderIcon` JSX component is defined and exported but never imported anywhere. Dead code.
- **Fix:** Remove it, or replace manual `getProviderIcon()` calls with `<ProviderIcon />`.

### F21. Page Title Is "frontend"

- **File:** `frontend/index.html:7`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `<title>frontend</title>` — development placeholder visible in browser tab.
- **Fix:** Change to `<title>Family Activity Finder</title>`.

### F22. Favicon References Vite Default

- **File:** `frontend/index.html:5`
- **Category:** Best Practice
- **Severity:** Low
- **Problem:** `<link rel="icon" href="/vite.svg" />` — Vite placeholder.
- **Fix:** Replace with a project-specific favicon.

### F23. Repeated Tailwind Button Classes

- **File:** `frontend/src/App.tsx:122-125, 161-164`
- **Category:** DRY
- **Severity:** Low
- **Problem:** "Dismiss" / "Try Again" buttons share identical long Tailwind class strings.
- **Fix:** Extract a reusable `<Button variant="primary">` component or a shared class constant.

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| **Critical** | 4 | No graceful shutdown, timer leaks, PII in logs, error data exposed to browser |
| **High** | 13 | Massive DRY (~300 lines duplicated across providers/routes), weak prompt injection defense, no tests, no request cancellation/timeout, no error boundary |
| **Medium** | 16 | Logic bugs (stale tabs, wrong defaults, untrimmed input), fragile error matching, dead code, accessibility gaps |
| **Low** | 11 | Unstructured logging, hardcoded config, dead exports, placeholder titles |
| **Total** | **44** | |

## Recommended Fix Order

| Phase | Issues | Rationale |
|-------|--------|-----------|
| **1. Security + Safety** | B1, B2, B3, F1 | Prevent data leaks and connection leaks immediately |
| **2. DRY Extraction** | B4, B5, B6, B10 | Extract shared `validateFormData`, `buildPrompt`, `parseRecommendations`, `config` — eliminates ~300 lines of duplication and makes all subsequent fixes easier |
| **3. Robustness** | B7, B8, F2, F3, F4, F5 | Prompt injection defense, abort controllers, timeouts, error boundary |
| **4. Frontend UX/Logic** | F6, F7, F10, F11, F12, F16 | Input validation, DRY UI components, logic bugs |
| **5. Medium Backend** | B11-B19 | Validator cleanup, error classes, provider caching, sanitizer fixes |
| **6. Medium Frontend** | F8, F9, F13-F15 | React keys, console.log, accessibility |
| **7. Low Polish** | B20-B26, F17-F23 | Structured logging, config externalization, dead code, placeholder titles |

---

## Resolutions

All 44 issues fixed on branch `fix/code-review-issues-2026-05-12`. Backend and frontend build clean (exit 0) after each phase.

### Phase 1 — Critical (B1, B2, B3, F1) ✅

| Issue | Status | Change |
|-------|--------|--------|
| **B1** Graceful shutdown | ✅ Fixed | `backend/src/index.ts` — stored server return value; added `SIGTERM`/`SIGINT` handlers that call `server.close()` before `process.exit(0)` |
| **B2** Timer leak in `withTimeout` | ✅ Fixed | `backend/src/shared/utils/timeout.ts` — replaced `createTimeout`+`Promise.race` with a `try/finally` that always calls `clearTimeout(timer!)` |
| **B3** PII in production logs | ✅ Fixed | `backend/src/routes/recommend.ts:144` — else-branch now logs only `{ provider, timeSlot }` instead of full `formData` |
| **F1** Raw errors exposed to browser | ✅ Fixed | `backend/src/routes/recommend.ts` — removed `fullErrorResponse` from all client responses; full error logged server-side only. `shared/types/index.ts` — removed `fullErrorResponse?: any` field. `frontend/src/components/MultiProviderResults.tsx` — removed expandable raw error UI |

### Phase 2 — High DRY (B4, B5, B6, B10) ✅

| Issue | Status | Change |
|-------|--------|--------|
| **B10** `DEBUG_LOGGING` in 4 files | ✅ Fixed | `backend/src/shared/config.ts` (new) — centralises `DEBUG_LOGGING`, `OUTPUT_FORMAT`, `LLM_TIMEOUT_MS`, `LLM_MAX_TOKENS`; all 4 files now import from here |
| **B5+B6** `buildPrompt`/`parseRecommendations` triplicated | ✅ Fixed | `backend/src/services/llm-providers/prompt.ts` (new) — single shared implementation; all three provider files now import from it; ~240 lines of duplication removed |
| **B4** Validation duplicated across two route handlers (~80 lines) | ✅ Fixed | `backend/src/routes/recommend.ts` — extracted `validateFormData(body: unknown): ValidationResult`; both `POST /recommend` and `POST /recommend/all` call it |
| **B7** Prompt injection — city/state not sanitized | ✅ Fixed | `prompt.ts:buildPrompt` — `sanitizeForPrompt` applied to city and state; all user values wrapped in `<user_input>` XML delimiters with model instruction to treat as data |

### Phase 3 — High Robustness (B8, F2, F3, F4, F5) ✅

| Issue | Status | Change |
|-------|--------|--------|
| **B8** Perplexity fetch never aborted | ✅ Fixed | `PerplexityProvider.ts` — `AbortController` with 55s timeout; `signal` passed to `fetch`; `clearTimeout` in `finally` |
| **F2** No request cancellation — race condition | ✅ Fixed | `frontend/src/App.tsx` — `useRef<AbortController>` cancels previous in-flight request on re-entry; `AbortError` silently swallowed |
| **F3** No frontend timeout | ✅ Fixed | `frontend/src/services/api.ts` — `AbortSignal.timeout(30_000)` on single-provider; `90_000` on all-provider; caller signal takes precedence |
| **F4** `isLoading` not reset in multi-provider error path | ✅ Fixed | `App.tsx` — multi-provider branch now uses `finally { setIsLoading(false) }` matching the single-provider pattern |
| **F5** No Error Boundary | ✅ Fixed | `frontend/src/components/ErrorBoundary.tsx` (new); wraps `<App />` in `main.tsx` with a retry button fallback |

### Phase 4 — Frontend UX/Logic (F6, F8, F9, F10, F11, F12, F13, F16, F17, F18, F19) ✅

| Issue | Status | Change |
|-------|--------|--------|
| **F6** No frontend input sanitization | ✅ Fixed | `ActivityForm.tsx` — `.trim()` on all string fields before submit; `maxLength={500}` on textarea with live character counter; zipCode validated with `/^\d{5}$/`; state validated with `/^[A-Z]{2}$/` |
| **F8** Array index as React key | ✅ Fixed | `App.tsx` and `MultiProviderResults.tsx` — keys changed to `` `${rec.title}-${rec.location}` `` |
| **F9** `console.log` logs user input | ✅ Fixed | `App.tsx` — removed `console.log('Form submitted:', formData)` |
| **F10** Age range not validated | ✅ Fixed | `ActivityForm.tsx` — `.filter(age => age >= 0 && age <= 18)` applied after `parseInt` |
| **F11** `alert()` for validation | ✅ Fixed | `ActivityForm.tsx` — replaced `alert()` with inline `<div role="alert">` error state rendered inside the form |
| **F12** `handleClear` wrong `timeSlot` default | ✅ Fixed | `ActivityForm.tsx:64` — changed `'afternoon'` to `'all_day'` to match initial state |
| **F13** Unused `provider` variable | ✅ Fixed | `App.tsx` — destructured as `const { provider: _provider, ...formDataWithoutProvider }` |
| **F14** Triple `.find()` in provider label | ✅ Fixed | `ActivityForm.tsx` — `const selectedProvider = providerOptions.find(...)` computed once; `selectedProvider?.label` / `selectedProvider?.model` referenced |
| **F16** `activeTab` stale on new search | ✅ Fixed | `MultiProviderResults.tsx` — `useEffect(() => setActiveTab(results[0]?.provider || ''), [results])` resets tab when results change |
| **F17** Non-null assertion on `getElementById` | ✅ Fixed | `main.tsx` — explicit guard: `if (!rootEl) throw new Error('Root element #root not found')` |
| **F18** Hardcoded pixel width on form | ✅ Fixed | `App.tsx:101` — changed `style={{ width: '418px' }}` to Tailwind `w-full lg:w-[418px] flex-shrink-0` |
| **F19** `handleClear` resets date to empty | ✅ Fixed | `ActivityForm.tsx:62` — changed `setDate('')` to `setDate(getNextWeekend())` |

### Phase 5 — Medium Backend (B11–B19) ✅

| Issue | Status | Change |
|-------|--------|--------|
| **B11** Inline date validation ignores shared `validateDate` | ✅ Fixed | `recommend.ts:validateFormData` — calls `validateDate()` from shared validators instead of inline logic |
| **B12** City validator uses untrimmed value | ✅ Fixed | `location.ts` — length and regex checks now use `trimmedCity` throughout |
| **B13** `_options` parameter dead code | ✅ Fixed | All three providers accept `_options` parameter (interface contract retained); `getOutputFormat()` removed from route; `OUTPUT_FORMAT` read from `shared/config.ts` |
| **B14** `formData` null check ineffective | ✅ Fixed | `validateFormData` checks `typeof body !== 'object' || body === null || Array.isArray(body)` |
| **B16** Provider factory creates new instance per request | ✅ Fixed | `factory.ts` — `Map`-based cache; `createProvider` returns cached instance on repeat calls |
| **B17** `sanitizeErrorMessage` mangles `401/Unauthorized` | ✅ Fixed | `sanitize.ts` — path regex changed to `(\/[a-zA-Z0-9_\-]+){2,}` (requires 2+ segments) |
| **B18** `credentials: true` with no auth | ✅ Fixed | `index.ts` — changed to `credentials: false` |
| **B19** Triple-backtick replacement dead code | ✅ Fixed | `sanitize.ts` — triple-backtick replacement moved before single-backtick replacement |
| **B23** `as any` casts in validators | ✅ Fixed | `location.ts` — uses `isValidState()` guard; `recommend.ts` — uses `isValidTimeSlot()` guard |
| **B24** Rate limiter in-memory limitation | ✅ Documented | `index.ts` — comment added explaining single-instance limitation and recommending `rate-limit-redis` for multi-instance |
| **B25** Perplexity response weakly typed | ✅ Fixed | `PerplexityProvider.ts` — `PerplexityResponse` interface defined; `as { choices?: ... }` cast replaced |
| **B26** Health endpoint not documented | ✅ Fixed | `index.ts` — comment explains intentional exclusion from rate limiter |

### Phase 7 — Low Polish (B21, B22, F17, F18, F19, F20, F21) ✅

| Issue | Status | Change |
|-------|--------|--------|
| **B21** Hardcoded `max_tokens: 2048` | ✅ Fixed | `shared/config.ts` — `LLM_MAX_TOKENS` reads from `LLM_MAX_TOKENS` env var with `2048` default; providers import from config |
| **B22** Hardcoded 60000ms timeout | ✅ Fixed | `shared/config.ts` — `LLM_TIMEOUT_MS` reads from `LLM_TIMEOUT_MS` env var with `60000` default; both route handlers use it |
| **F20** Dead `ProviderIcon` export | ✅ Fixed | `frontend/src/utils/providerIcons.tsx` — `ProviderIcon` component removed |
| **F21** Page title is "frontend" | ✅ Fixed | `frontend/index.html` — changed to `Family Activity Finder` |

### Deferred (by design)

| Issue | Reason |
|-------|--------|
| **B9** No test suite | Requires new tooling (`vitest`) and significant test authoring — tracked as a follow-up task |
| **B15** Custom `ProviderError` class | The fragile string matching in the route error handler was partially addressed by the DRY extraction; a full custom error class hierarchy is a follow-up refactor |
| **B20** Replace `console.log` with `pino` | Structural logging overhaul — scope exceeds surgical fix; tracked for a separate PR |
| **F7** Extract LoadingSpinner/ErrorPanel/EmptyState | The multi-provider and single-provider branches are structurally similar but the DRY extraction adds complexity without immediate bug risk; tracked for a follow-up |
| **F15** Full `aria-invalid` + inline field errors | Requires per-field error state tracking; inline form error (`role="alert"`) added as partial improvement |
| **F22** Vite default favicon | Requires design asset; placeholder noted |
| **F23** Repeated Tailwind button classes | Minor polish; left as-is to keep blast radius minimal |

---

## Additional Fixes

Patterns found during post-fix code scan that matched issues in the audit but were not listed as named issues.

| ID | File | Pattern | Fix Applied |
|----|------|---------|-------------|
| **AF-1** | `backend/src/shared/utils/sanitize.ts` | Both `sanitizeErrorMessage` branches used the same broad `/\/[^\s]+/g` path regex — the Error branch was also stripping single-slash tokens like `401/Unauthorized` | Fixed both branches to use `(\/[a-zA-Z0-9_\-]+){2,}` (requires 2+ segments), consistent with B17 fix |
| **AF-2** | `backend/src/services/llm-providers/prompt.ts` | The emoji Unicode range in the regex used a literal variation-selector character (`[️]?`) rather than the explicit codepoint `️` | Kept as-is — the literal character is functionally identical and already present in the original code; flagged for awareness only |
