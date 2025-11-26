# Family Activity Finder - Project Specification

## Project Overview

**App Name:** Family Activity Finder

**Purpose:** Help parents discover real, current family-friendly activities in their local area based on their kids' ages, schedule, and preferences.

**Target Users:** Parents with children seeking weekend activities

**Core Value Proposition:** Get 5 personalized, real-time activity recommendations using AI-powered web search - no manual browsing required.

---

## Requirements

### Functional Requirements

1. **Input Collection:**
   - City (required)
   - State (required, 2-letter US state code)
   - Zip Code (optional, 5-digit for precision)
   - Children's ages (multiple ages supported, comma-separated)
   - Date (required, HTML5 date picker, YYYY-MM-DD format)
   - Time slot (required: All Day, Morning, Afternoon, Evening, or Night)
   - Driving distance radius (in miles, 1-50)
   - Additional preferences (optional: indoor/outdoor, educational, active, etc.)
   - AI Provider selection (optional: Anthropic Claude, Perplexity, Gemini, or All)

2. **Activity Recommendations:**
   - Display exactly 5 recommendations per provider
   - Each recommendation includes:
     - Relevant emoji
     - **Bold title** with venue/event name and timing
     - Location name (specific venue or neighborhood)
     - Distance from search location
     - 2-4 sentence description with key details
   - Recommendations based on real, current data from web search
   - Multi-provider support: Query single provider or all providers in parallel
   - Tabbed interface for comparing results from multiple providers

3. **User Experience:**
   - Loading state while searching
   - Clear error messages if search fails
   - Responsive design (works on mobile and desktop)
   - Simple, clean interface

### Technical Requirements

- TypeScript for type safety
- Server-side API calls only (no exposed API keys)
- Environment variable management
- Proper error handling and validation
- CORS configuration for frontend-backend communication
- Real-time web search via multiple AI providers (Anthropic Claude, Perplexity, Google Gemini)
- Multi-provider architecture with factory pattern for extensibility

---

## Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite
- **HTTP Client:** Fetch API

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5 with TypeScript
- **AI SDKs:**
  - @anthropic-ai/sdk (Claude)
  - @google/generative-ai (Gemini)
  - Perplexity API (via fetch)
- **Security:** Helmet, express-rate-limit, CORS
- **Environment:** dotenv for configuration

### APIs

- **Anthropic Claude Messages API**
  - Model: `claude-sonnet-4-5-20250929` (configurable via env)
  - Tool: Web Search enabled
  - Documentation: <https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool>
- **Perplexity Chat Completions API**
  - Model: `sonar` (configurable via env)
  - Built-in web search
  - Documentation: <https://docs.perplexity.ai/>
- **Google Gemini API**
  - Model: `gemini-2.5-flash` (configurable via env)
  - Limited web search capabilities
  - Documentation: <https://ai.google.dev/>

### Deployment
- **Frontend:** Vercel
- **Backend:** Vercel Serverless Functions (or Express server)
- **Environment Variables:** Vercel dashboard

---

## Design Guidelines

### Visual Design

- Clean, minimal interface inspired by modern web apps
- Single-page layout with clear visual hierarchy
- Generous whitespace for readability
- Professional color scheme (blues/greens for trust and family-friendly feel)

### UI Components

**Input Form:**
- Grouped input fields with clear labels
- Text inputs for city, state, zip code, ages, preferences
- HTML5 date picker for date selection
- Dropdown for time slot selection
- Range slider for distance
- Radio buttons for AI provider selection
- Large, prominent submit button
- Inline validation hints

**Recommendation Cards:**
- Card-based layout (grid or list)
- Emoji at top or left side
- Bold, large title
- Readable body text (16px+)
- Subtle borders or shadows
- Hover effects for interactivity

**States:**
- Empty state (initial load)
- Loading state (spinner with message)
- Success state (recommendations displayed)
- Multi-provider loading state (parallel queries in progress)
- Multi-provider results (tabbed interface)
- Error state (friendly error message with retry option)
- Per-provider error states (individual failures don't break entire request)

### Responsive Design
- Mobile-first approach
- Single column on mobile
- 2-3 columns on tablet/desktop
- Touch-friendly buttons (min 44x44px)

### Accessibility
- Semantic HTML elements
- Proper ARIA labels
- Keyboard navigation support
- Sufficient color contrast (WCAG AA)

---

## Project Milestones

### Milestone 1: UI Foundation with Dummy Data
**Goal:** Build fully functional frontend with static data

**Important:** See `todo.md` for a detailed, step-by-step task checklist for this milestone with 20 specific tasks, acceptance criteria, and troubleshooting tips.

**High-Level Tasks:**
- [ ] Initialize React + Vite + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Create project file structure (components, types, data directories)
- [ ] Build input form component with all 5 fields:
  - City (text input)
  - Kids' ages (text input for comma-separated ages)
  - Date/time availability (text input)
  - Driving distance (number input with "miles" label)
  - Preferences (textarea, optional)
  - Submit button
- [ ] Create recommendation card component
- [ ] Create 5 hardcoded dummy recommendations in `src/data/dummyData.ts`
- [ ] Implement responsive grid layout for recommendations
- [ ] Add basic form validation
- [ ] Style with Tailwind CSS (responsive, mobile-first)

**Deliverable:** Fully functional UI that displays dummy recommendations on form submit

**Success Criteria:**
- Form accepts all required inputs
- UI is responsive on mobile and desktop
- Dummy recommendations display correctly with emojis, bold titles, descriptions
- Clean, professional appearance

**Estimated Time:** 90-120 minutes (see detailed breakdown in `todo.md`)

---

### Milestone 2: AI Provider Integration with Web Search
**Goal:** Connect to AI providers and retrieve real activity data

**Important:** This milestone uses the production-ready prompt template from `prompt.md`. All prompt engineering work, variable injection patterns, and response parsing logic are documented there.

**Tasks:**
- [x] Set up Express.js backend with TypeScript
- [x] Install AI SDK packages (@anthropic-ai/sdk, @google/generative-ai)
- [x] Configure environment variables (.env file with API keys)
- [x] Create `/api/recommend` POST endpoint
- [x] **Use the prompt template from `prompt.md`:**
  - Inject all input variables: city, state, zipCode, ages, date, timeSlot, distance, preferences
  - Follow the TypeScript implementation example in prompt.md
  - Enable web search tools for each provider
- [x] Implement Anthropic Claude API call with web search
- [x] Implement Perplexity API call with web search
- [x] Implement Google Gemini API call
- [x] Parse responses using consistent parsing logic
- [x] Format recommendations for frontend (emoji, title, location, distance, description)
- [x] Update frontend to call backend API
- [x] Implement loading state during API call
- [x] Handle errors gracefully (API failures, no results, network issues)
- [x] Enable CORS for frontend-backend communication
- [x] Test with various inputs

**Deliverable:** Working end-to-end application with real web search results from multiple AI providers

**Success Criteria:**
- Backend successfully calls AI provider APIs with web search
- Real, current activities are returned for given location and date
- Recommendations are age-appropriate and within distance
- Error handling works for common failure cases
- Loading states provide good UX
- All input fields properly inject into the prompt template

**Reference Documentation:**

- **Prompt Template:** See `prompt.md` for complete implementation details
- Claude Web Search Tool: <https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool>
- Perplexity API: <https://docs.perplexity.ai/>
- Google Gemini API: <https://ai.google.dev/>

---

### Milestone 3: Production Security & Git Setup
**Goal:** Secure the application for production deployment

**Tasks:**
- [x] Add comprehensive input validation (client and server)
- [x] Implement security hardening (CORS, rate limiting, request size limits)
- [x] Add security headers with Helmet
- [x] Sanitize error messages (no internal details exposed)
- [x] Create SECURITY.md documentation
- [x] Update README.md with security information
- [x] Initialize Git repository
- [x] Create GitHub repository
- [x] Set up .gitignore files
- [x] Run security audits (npm audit)
- [x] Test all security features

**Deliverable:** Production-ready, secure application

**Success Criteria:**
- All security features implemented and tested
- No vulnerabilities in dependencies
- Complete documentation
- Version control established

### Milestone 4: Multi-Provider Support
**Goal:** Support multiple AI providers with parallel query capability

**Tasks:**
- [x] Create provider factory pattern for extensibility
- [x] Implement AnthropicProvider class
- [x] Implement PerplexityProvider class
- [x] Implement GeminiProvider class
- [x] Create unified LLMProvider interface
- [x] Add provider selection to frontend form
- [x] Implement `/api/recommend/all` endpoint for parallel queries
- [x] Create MultiProviderResults component with tabbed interface
- [x] Handle individual provider failures gracefully
- [x] Add provider icons and model name display
- [x] Test parallel query functionality

**Deliverable:** Multi-provider support with parallel query capability

**Success Criteria:**
- Users can select from multiple AI providers
- Parallel queries work correctly
- Individual provider failures don't break entire request
- Results displayed in user-friendly tabbed interface

---

## File Structure

```
family-activity-finder/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityForm.tsx
│   │   │   ├── RecommendationCard.tsx
│   │   │   └── MultiProviderResults.tsx  # Milestone 4: Multi-provider UI
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   └── providerIcons.tsx
│   │   ├── data/
│   │   │   └── dummyData.ts          # Milestone 1: Sample recommendations
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── docs/
│   │   └── README.md
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── recommend.ts          # Single & parallel query endpoints
│   │   ├── services/
│   │   │   └── llm-providers/        # Milestone 4: Multi-provider support
│   │   │       ├── AnthropicProvider.ts
│   │   │       ├── PerplexityProvider.ts
│   │   │       ├── GeminiProvider.ts
│   │   │       ├── factory.ts
│   │   │       └── types.ts
│   │   ├── shared/
│   │   │   ├── constants/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── validators/
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts                  # Express server setup
│   ├── docs/
│   │   └── SECURITY.md               # Milestone 3: Security documentation
│   ├── dist/                         # Compiled TypeScript output
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── spec.md                            # Project specification (this file)
├── prompt.md                          # Prompt template & implementation guide
├── todo.md                            # Detailed task checklist (Milestones 1-4)
└── README.md                          # Main project documentation
```

---

## API Endpoint Specification

### POST /api/recommend

**Request Body:**
```typescript
{
  city: string;              // "Dublin"
  state: string;             // "CA" (2-letter US state code)
  zipCode?: string;          // "94568" (optional, 5 digits)
  ages: number[];            // [5, 8]
  date: string;              // "2025-11-16" (YYYY-MM-DD format)
  timeSlot: string;          // "all_day" | "morning" | "afternoon" | "evening" | "night"
  distance: number;          // 10 (miles, 1-50)
  preferences?: string;      // "outdoor activities, educational" (max 500 chars)
  provider?: string;         // "anthropic" | "perplexity" | "gemini" (optional, defaults to "anthropic")
}
```

**Response:**
```typescript
{
  recommendations: [
    {
      emoji: string;         // "🎨"
      title: string;          // "Children's Art Workshop - Saturday 2pm-4pm"
      location: string;       // "Downtown Dublin"
      distance: string;       // "2 miles"
      description: string;    // "2-4 sentences describing the activity"
    }
    // ... 4 more
  ]
}
```

### POST /api/recommend/all

**Request Body:** Same as `/api/recommend` but without `provider` field

**Response:**
```typescript
[
  {
    provider: string;        // "anthropic"
    modelName: string;        // "Claude Sonnet 4.5"
    recommendations?: Recommendation[];
    error?: string;           // Present if provider failed
    fullErrorResponse?: any;  // Detailed error info (debug mode only)
  }
  // ... one entry per available provider
]
```

**Error Response:**
```typescript
{
  error: string;            // "Unable to find activities. Please try again."
}
```

---

## AI Provider Prompt Template

**See `prompt.md` for the complete, production-ready prompt template.**

The prompt template in `prompt.md` includes:
- Full prompt with all input variables (city, state, zipCode, ages, date, timeSlot, distance, preferences)
- TypeScript implementation example with variable injection
- Response parsing logic (consistent across all providers)
- Error handling patterns
- Test cases and expected outputs
- Output format configuration (markdown or JSON)

**Quick Reference - Input Variables:**
- `{city}` - User's city
- `{state}` - 2-letter US state code
- `{zipCode}` - Optional 5-digit ZIP code
- `{ages}` - Array of children's ages
- `{date}` - Date in YYYY-MM-DD format
- `{timeSlot}` - Time slot (all_day, morning, afternoon, evening, night)
- `{distance}` - Driving radius in miles
- `{preferences}` - Optional additional preferences

**For implementation details, refer to `prompt.md` for complete documentation.**

---

## Success Metrics

### Milestone 1
- UI renders correctly
- Form is usable and intuitive
- Dummy data displays properly

### Milestone 2
- 90%+ successful API calls
- Relevant, real activities returned
- Average response time <20 seconds (with web search)

### Milestone 3
- All security features implemented and tested
- Zero npm vulnerabilities
- Production-ready security configuration

### Milestone 4
- Multi-provider support functional
- Parallel queries working correctly
- Individual provider failures handled gracefully

---

## Development Guidelines

### Code Quality
- Use TypeScript strict mode
- Follow React best practices (hooks, functional components)
- Write clean, readable code with comments
- Use meaningful variable/function names

### Security
- Never expose API keys in frontend code
- Validate all user inputs
- Sanitize data before passing to Claude
- Use environment variables for secrets

### Testing Approach
- Manual testing for MVP
- Test edge cases (empty inputs, API failures)
- Test on multiple browsers/devices

---

## Future Enhancements (Post-MVP)

- 🔗 **Website URLs** - Display primary website URLs for each recommendation (e.g., museum websites, event pages)
- Save favorite activities
- Share recommendations via link
- Filter by price range (free, under $20, etc.)
- Map view showing activity locations
- User accounts and history
- Calendar integration
- Weather-aware recommendations

---

## Resources

- **Claude API Docs:** <https://docs.anthropic.com/>
- **Web Search Tool:** <https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool>
- **React Docs:** <https://react.dev/>
- **Tailwind CSS:** <https://tailwindcss.com/>
- **Vite:** <https://vitejs.dev/>
