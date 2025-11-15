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
   - City/location
   - Children's ages (multiple ages supported)
   - Date/time availability (e.g., "Saturday afternoon", "Sunday morning", specific date)
   - Driving distance radius (in miles)
   - Additional preferences (optional: indoor/outdoor, educational, active, etc.)

2. **Activity Recommendations:**
   - Display exactly 5 recommendations
   - Each recommendation includes:
     - Relevant emoji
     - **Bold title** with venue/event name
     - 2-4 sentence description with key details
   - Recommendations based on real, current data from web search

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
- Real-time web search via Claude API

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **HTTP Client:** Fetch API / Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js with TypeScript
- **AI SDK:** @anthropic-ai/sdk
- **Environment:** dotenv for configuration

### APIs
- **Claude Messages API**
  - Model: `claude-sonnet-4-5-20250929`
  - Tool: Web Search enabled
  - Documentation: https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool

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
- Text inputs for city, date/time, preferences
- Number inputs for ages and distance
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
- Loading state (spinner or skeleton)
- Success state (recommendations displayed)
- Error state (friendly error message with retry option)

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

### Milestone 2: Claude API Integration with Web Search
**Goal:** Connect to Claude API and retrieve real activity data

**Important:** This milestone uses the production-ready prompt template from `prompt.md`. All prompt engineering work, variable injection patterns, and response parsing logic are documented there.

**Tasks:**
- [ ] Set up Express.js backend with TypeScript
- [ ] Install @anthropic-ai/sdk package
- [ ] Configure environment variables (.env file with ANTHROPIC_API_KEY)
- [ ] Create `/api/recommend` POST endpoint
- [ ] **Use the prompt template from `prompt.md`:**
  - Inject the 5 input variables: city, ages, availability, distance, preferences
  - Follow the TypeScript implementation example in prompt.md
  - Enable web search tool: `tools: [{ type: "web_search" }]`
- [ ] Implement Claude Messages API call with web search:
  ```typescript
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    tools: [{ type: 'web_search' }],
    messages: [{ role: 'user', content: promptFromPromptMd }]
  });
  ```
- [ ] Parse Claude's response using the parsing logic from prompt.md
- [ ] Format recommendations for frontend (emoji, title, description)
- [ ] Update frontend to call backend API (fetch or axios)
- [ ] Implement loading state during API call
- [ ] Handle errors gracefully (API failures, no results, network issues)
- [ ] Enable CORS for frontend-backend communication
- [ ] Test with various inputs from prompt.md test cases

**Deliverable:** Working end-to-end application with real web search results

**Success Criteria:**
- Backend successfully calls Claude API with web search
- Real, current activities are returned for given location and date
- Recommendations are age-appropriate and within distance
- Error handling works for common failure cases
- Loading states provide good UX
- All 5 input fields properly inject into the prompt template

**Reference Documentation:**
- **Prompt Template:** See `prompt.md` for complete implementation details
- Claude Web Search Tool: https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool
- Claude Messages API: https://docs.anthropic.com/en/api/messages

---

### Milestone 3: Polish & Deployment
**Goal:** Production-ready application

**Tasks:**
- [ ] Refine prompt engineering for better recommendations
- [ ] Add comprehensive input validation (client and server)
- [ ] Improve error messages with actionable guidance
- [ ] Add accessibility features (ARIA labels, keyboard nav)
- [ ] Optimize performance (lazy loading, code splitting)
- [ ] Add meta tags for SEO
- [ ] Create README.md with setup instructions
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend API (Vercel Serverless or dedicated server)
- [ ] Configure environment variables in deployment
- [ ] Test deployed version thoroughly
- [ ] Monitor for errors and performance

**Deliverable:** Live, production-ready application

**Success Criteria:**
- App is publicly accessible via URL
- All features work in production
- Fast load times (<3 seconds)
- No console errors
- Responsive on all devices
- API keys are secure (never exposed to client)

---

## File Structure

```
family-activity-finder/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActivityForm.tsx
│   │   │   └── RecommendationCard.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   └── dummyData.ts          # Milestone 1: Sample recommendations
│   │   ├── App.tsx
│   │   └── main.tsx
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
│   │   │   └── recommend.ts
│   │   ├── services/
│   │   │   └── claude.ts             # Milestone 2: Claude API integration
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── spec.md                            # Project specification (this file)
├── prompt.md                          # Milestone 2: Claude prompt template
├── todo.md                            # Milestone 1: Task checklist
└── README.md
```

---

## API Endpoint Specification

### POST /api/recommend

**Request Body:**
```typescript
{
  city: string;              // "San Francisco, CA"
  ages: number[];            // [5, 8]
  availability: string;      // "Saturday afternoon"
  distance: number;          // 10 (miles)
  preferences?: string;      // "outdoor activities, educational"
}
```

**Response:**
```typescript
{
  recommendations: [
    {
      emoji: string;         // "🎨"
      title: string;         // "Children's Art Workshop at SFMOMA"
      description: string;   // "2-4 sentences describing the activity"
    }
    // ... 4 more
  ]
}
```

**Error Response:**
```typescript
{
  error: string;            // "Unable to find activities. Please try again."
}
```

---

## Claude Prompt Template

**See `prompt.md` for the complete, production-ready prompt template.**

The prompt template in `prompt.md` includes:
- Full prompt with all 5 input variables (city, ages, availability, distance, preferences)
- TypeScript implementation example with variable injection
- Response parsing logic
- Error handling patterns
- Test cases and expected outputs
- Alternative JSON format option

**Quick Reference - Input Variables:**
- `{city}` - User's city/location
- `{ages}` - Comma-separated children's ages
- `{availability}` - When they're free (e.g., "Saturday afternoon")
- `{distance}` - Driving radius in miles
- `{preferences}` - Optional additional preferences

**For Milestone 2 implementation, refer to `prompt.md` for complete details.**

---

## Success Metrics

### Milestone 1
- UI renders correctly
- Form is usable and intuitive
- Dummy data displays properly

### Milestone 2
- 90%+ successful API calls
- Relevant, real activities returned
- Average response time <5 seconds

### Milestone 3
- App deployed and accessible
- Zero critical bugs
- Positive user feedback

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

- Save favorite activities
- Share recommendations via link
- Filter by price range (free, under $20, etc.)
- Map view showing activity locations
- User accounts and history
- Calendar integration
- Weather-aware recommendations

---

## Resources

- **Claude API Docs:** https://docs.anthropic.com/
- **Web Search Tool:** https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool
- **React Docs:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Vite:** https://vitejs.dev/
