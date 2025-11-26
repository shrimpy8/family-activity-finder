# Multi-LLM Provider Prompt Template - Family Activity Finder

This document contains the production prompt templates used to call various LLM providers (Anthropic Claude, Perplexity, Google Gemini) with web search capabilities.

## Supported Providers

- **Anthropic Claude Sonnet 4.5** - Native web search via `web_search` tool
- **Perplexity Sonar** - Built-in real-time web search
- **Google Gemini 2.5 Flash** - Basic implementation (web search capabilities may vary)

---

## Input Variables

The following variables will be injected from the user's form submission:

- **`{city}`** - User's city (e.g., "Dublin", "San Francisco")
- **`{state}`** - US state abbreviation (e.g., "CA", "TX")
- **`{zipCode}`** - Optional 5-digit zip code for precision (e.g., "94568")
- **`{locationStr}`** - Combined location string: "{city}, {state} {zipCode}, USA" or "{city}, {state}, USA"
- **`{ages}`** - Comma-separated list of children's ages (e.g., "5, 8", "3, 7, 12")
- **`{date}`** - Specific date in YYYY-MM-DD format (e.g., "2024-12-21")
- **`{dateStr}`** - Human-readable date (e.g., "Saturday, December 21, 2024")
- **`{timeSlot}`** - Selected time period: "all_day", "morning", "afternoon", "evening", or "night"
- **`{timeStr}`** - Human-readable time (e.g., "All Day", "Morning (8 AM - 12 PM)")
- **`{distance}`** - Driving radius in miles (e.g., "10", "25")
- **`{preferences}`** - Additional preferences or requirements (e.g., "outdoor activities, educational, free or low-cost")

---

## Main Prompt Template

```text
You are a family activity expert helping parents discover real, current activities for their children.

**Task:** Search the web for family-friendly activities happening in {locationStr}, USA that match the following criteria.

**Requirements:**
- **Location:** {locationStr}, USA and surrounding areas within {distance} miles
- **Children's Ages:** {ages} years old
- **Date:** {dateStr}
- **Time:** {timeStr}
- **Preferences:** {preferences}

**Instructions:**
1. Use web search to find REAL, CURRENT activities - not hypothetical suggestions
2. Focus on activities actually happening during the specified time
3. Find a diverse mix including:
   - Local events (festivals, markets, workshops, performances, story times)
   - Standing venues (museums, parks, play spaces, libraries, entertainment centers)
   - Both free and paid options when possible
   - Indoor and outdoor options for variety

4. Ensure all activities are:
   - Age-appropriate for children ages {ages}
   - Actually available on {dateStr} during {timeStr}
   - Within {distance} miles of {locationStr}, USA
   - Safe and family-friendly

5. Provide exactly **5 recommendations**

**Output Format:**
For each recommendation, provide:

1. **Emoji:** A single relevant emoji that represents the activity type
2. **Title:** The venue or event name with timing (e.g., "Museum Name - Sunday 10am-4pm")
3. **Location:** Specific location or neighborhood name
4. **Distance:** Approximate distance from {locationStr} (e.g., "0.5 miles", "2 miles")
5. **Description:** 2-4 sentences including:
   - What the activity is and what makes it special
   - Key practical details (e.g., "Free admission", "Open 10am-5pm")
   - Why it's great for kids of the specified ages

**Format each recommendation EXACTLY as:**

```markdown
[Emoji] **[Activity Title with Timing]**
📍 [Location Name] • [Distance]
[Description paragraph]
```

**Example:**

```text
🎨 **Children's Art Workshop at SFMOMA - Saturday 2pm-4pm**
📍 San Francisco Museum of Modern Art • 0.3 miles
The San Francisco Museum of Modern Art hosts hands-on art workshops every Saturday afternoon specifically designed for kids ages 4-10. The free workshops let children create their own masterpieces inspired by current exhibitions. Perfect for creative kids who love getting messy with paint and exploring different art techniques.
```

Please prioritize:

- Accuracy (verify activities are real and current via web search)
- Diversity (different types of activities, not all museums or all parks)
- Age-appropriateness (genuinely suitable for {ages})
- Practical usefulness (include enough detail for parents to make decisions)

Begin your web search now and provide 5 recommendations.
```

---

## API Implementation (TypeScript)

### Provider Architecture

The application uses a provider abstraction pattern to support multiple LLM providers:

```typescript
// Provider interface
interface LLMProvider {
  generateRecommendations(formData: ActivityFormData, options?: GenerateOptions): Promise<Recommendation[]>;
  supportsWebSearch(): boolean;
  getModelName(): string;
  getProviderId(): string;
}
```

### Anthropic Claude Implementation

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ActivityFormData {
  city: string;
  state: string;
  zipCode?: string;
  ages: number[];
  date: string; // YYYY-MM-DD format
  timeSlot: 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night';
  distance: number;
  preferences: string;
}

async function getRecommendations(formData: ActivityFormData) {
  const { city, state, zipCode, ages, date, timeSlot, distance, preferences } = formData;
  const agesStr = ages.join(', ');
  const preferencesStr = preferences || 'No specific preferences';

  // Build location string
  const locationStr = zipCode
    ? `${city}, ${state} ${zipCode}`
    : `${city}, ${state}`;

  // Convert date to human-readable format
  const dateObj = new Date(date + 'T12:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Convert time slot to human-readable format
  const timeSlotMap = {
    all_day: 'All Day',
    morning: 'Morning (8 AM - 12 PM)',
    afternoon: 'Afternoon (12 PM - 4 PM)',
    evening: 'Evening (4 PM - 8 PM)',
    night: 'Night (8 PM - 11 PM)'
  };
  const timeStr = timeSlotMap[timeSlot];

  const prompt = `You are a family activity expert helping parents discover real, current activities for their children.

**Task:** Search the web for family-friendly activities happening in ${locationStr}, USA that match the following criteria.

**Requirements:**
- **Location:** ${locationStr}, USA and surrounding areas within ${distance} miles
- **Children's Ages:** ${agesStr} years old
- **Date:** ${dateStr}
- **Time:** ${timeStr}
- **Preferences:** ${preferencesStr}

**Instructions:**
1. Use web search to find REAL, CURRENT, TIMELY activities - not hypothetical suggestions
2. Focus on activities actually happening during the specified time
3. Find a diverse mix including:
   - Local events (festivals, markets, workshops, performances, story times)
   - Standing venues (museums, parks, play spaces, libraries, entertainment centers)
   - Both free and paid options when possible
   - Indoor and outdoor options for variety

4. Ensure all activities are:
   - Age-appropriate for children ages ${agesStr}
   - Actually available on ${dateStr} during ${timeStr}
   - Within ${distance} miles of ${locationStr}, USA
   - Safe and family-friendly

5. Provide exactly **5 recommendations**

**Output Format:**
For each recommendation, provide:

1. **Emoji:** A single relevant emoji that represents the activity type
2. **Title:** The venue or event name with timing (e.g., "Museum Name - Sunday 10am-4pm")
3. **Location:** Specific location or neighborhood name
4. **Distance:** Approximate distance from ${locationStr} (e.g., "0.5 miles", "2 miles")
5. **Description:** 2-4 sentences including:
   - What the activity is and what makes it special
   - Key practical details (e.g., "Free admission", "Open 10am-5pm")
   - Why it's great for kids of the specified ages

**Format each recommendation EXACTLY as:**
\`\`\`
[Emoji] **[Activity Title with Timing]**
📍 [Location Name] • [Distance]
[Description paragraph]
\`\`\`

**Example:**
\`\`\`
🎨 **Children's Art Workshop at SFMOMA - Saturday 2pm-4pm**
📍 San Francisco Museum of Modern Art • 0.3 miles
The San Francisco Museum of Modern Art hosts hands-on art workshops every Saturday afternoon specifically designed for kids ages 4-10. The free workshops let children create their own masterpieces inspired by current exhibitions. Perfect for creative kids who love getting messy with paint and exploring different art techniques.
\`\`\`

Please prioritize:
- Accuracy (verify activities are real and current via web search)
- Diversity (different types of activities, not all museums or all parks)
- Age-appropriateness (genuinely suitable for ${agesStr})
- Practical usefulness (include enough detail for parents to make decisions)

Begin your web search now and provide 5 recommendations.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    tools: [{ type: 'web_search' }],
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return message;
}
```

---

## Response Parsing

Claude's response will be in the `message.content` array. You'll need to extract the text content and parse it.

### Expected Response Structure

```typescript
{
  id: 'msg_...',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: '🎨 **Children's Art Workshop...\n\n🦕 **Natural History Museum...'
    }
  ],
  // ... other fields
}
```

### Parsing Logic

```typescript
function parseRecommendations(responseText: string) {
  const recommendations = [];

  // Split by double newlines to separate recommendations
  const sections = responseText.split('\n\n').filter(s => s.trim());

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const firstLine = lines[0];

    // Extract emoji (first character)
    const emoji = firstLine.charAt(0);

    // Extract title (text between ** **)
    const titleMatch = firstLine.match(/\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1] : '';

    // Description is the rest of the text
    const description = lines.slice(1).join(' ').trim();

    if (emoji && title && description) {
      recommendations.push({ emoji, title, description });
    }
  }

  return recommendations.slice(0, 5); // Ensure only 5
}
```

---

## Alternative: JSON Output Format

If you prefer structured JSON output for easier parsing, modify the prompt:

```text
**Output Format:**
Return your response as a JSON array with exactly 5 objects, each with this structure:

{
  "emoji": "🎨",
  "title": "Children's Art Workshop at SFMOMA",
  "description": "The San Francisco Museum of Modern Art hosts..."
}

Return ONLY the JSON array, no other text.
```

Then parse as:

```typescript
const recommendations = JSON.parse(responseText);
```

---

## Testing the Prompt

### Test Inputs

**Test Case 1: Specific Weekend**

- City: "Portland, Oregon"
- Ages: [5, 8]
- Availability: "Saturday, March 16, 2024"
- Distance: 15
- Preferences: "outdoor activities, free or low-cost"

**Test Case 2: General Availability**

- City: "Austin, Texas"
- Ages: [3, 6, 10]
- Availability: "this weekend"
- Distance: 20
- Preferences: "educational, indoor options"

**Test Case 3: No Preferences**

- City: "Seattle, WA"
- Ages: [7]
- Availability: "Sunday afternoon"
- Distance: 10
- Preferences: ""

### Expected Outcomes

✅ 5 real activities found via web search
✅ All age-appropriate
✅ Mix of activity types (not all the same)
✅ Includes practical details (location, cost, hours)
✅ Properly formatted with emoji, bold title, description

---

## Prompt Refinement Tips

### If Results Are Not Relevant

- Add more specific location context: "in the {city} metro area"
- Emphasize timing: "specifically available on {availability}"
- Add negative constraints: "Do NOT suggest activities that require advance booking weeks in advance"

### If Results Are Too Generic

- Request more specific details: "Include exact addresses or neighborhood names"
- Ask for current information: "Verify these are currently operating in 2024"

### If Results Don't Match Ages

- Be more explicit: "These activities must be safe and engaging specifically for {ages}-year-olds, not just 'family-friendly' in general"

### If Not Getting 5 Results

- Relax some constraints: "If you can't find enough options within {distance} miles, expand up to {distance + 10} miles"
- Allow broader categories: "Include both special events AND everyday venues"

---

## Error Handling

### Scenarios to Handle in Code

1. **No activities found**

   - Response: "Sorry, we couldn't find activities matching your criteria. Try expanding your distance or being more flexible with timing."

2. **API timeout or failure**

   - Response: "We're having trouble searching right now. Please try again in a moment."

3. **Incomplete response (less than 5)**

   - Decide whether to:
     - Show what was found ("We found 3 activities for you...")
     - OR request exactly 5 by retrying

4. **Parsing errors**

   - Log the raw response for debugging
   - Show generic error to user
   - Consider implementing fallback parsing logic

---

## Performance Considerations

- **Expected response time:** 5-15 seconds (due to web search)
- **Token usage:** ~1500-2500 tokens per request
- **Cost estimate:** ~$0.01-0.03 per request (with Sonnet pricing)

### Optimization Ideas:
- Cache results for same location/date for 1 hour
- Implement request debouncing on frontend
- Show loading indicator with estimated time

---

## Future Enhancements

1. **Follow-up questions:** Allow Claude to ask clarifying questions if criteria are ambiguous
2. **Seasonal awareness:** Adjust recommendations based on current season/weather
3. **Personalization:** Remember user preferences across sessions
4. **Ratings integration:** Ask Claude to include parent ratings when available from web search
5. **Booking links:** Request direct links to ticket purchases or reservations when applicable

---

## Multi-Provider Support

### Provider Selection

Users can select their preferred LLM provider in the ActivityForm UI:
- **Anthropic Claude Sonnet 4.5** (Default) - Best for detailed, citation-backed recommendations
- **Perplexity Sonar Large Online** - Fast, real-time web search results
- **Google Gemini 2.0 Flash** - General purpose (web search capabilities may vary)

### Output Formats

- **Markdown** (Default) - Human-readable format with emojis and formatting
- **JSON** - Structured data format for programmatic use

### Environment Variables

Each provider requires its own API key:
- `ANTHROPIC_API_KEY` - Required for Anthropic Claude
- `PERPLEXITY_API_KEY` - Required for Perplexity
- `GEMINI_API_KEY` - Required for Google Gemini

At least one provider API key must be configured. The default provider is Anthropic Claude.

## References

- **Claude Messages API:** <https://docs.anthropic.com/en/api/messages>
- **Web Search Tool:** <https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool>
- **Prompt Engineering Guide:** <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering>
- **Perplexity API:** <https://docs.perplexity.ai/>
- **Google Gemini API:** <https://ai.google.dev/docs>
