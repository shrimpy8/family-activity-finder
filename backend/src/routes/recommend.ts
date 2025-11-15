import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import type { ActivityFormData, Recommendation, RecommendResponse } from '../types';

const router = Router();

// Build prompt from template
function buildPrompt(formData: ActivityFormData): string {
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

  return `You are a family activity expert helping parents discover real, current activities for their children.

**Task:** Search the web for family-friendly activities happening in ${locationStr}, USA that match the following criteria.

**Requirements:**
- **Location:** ${locationStr}, USA and surrounding areas within ${distance} miles
- **Children's Ages:** ${agesStr} years old
- **Date:** ${dateStr}
- **Time:** ${timeStr}
- **Preferences:** ${preferencesStr}

**Instructions:**
1. Use web search to find REAL, CURRENT activities - not hypothetical suggestions
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
}

// Parse Claude's response into structured recommendations
function parseRecommendations(responseText: string): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Split by emoji pattern (emoji at start of line)
  const sections = responseText.split(/\n(?=[^\s])/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Extract emoji (first character if it's an emoji)
    const emojiMatch = trimmed.match(/^([^\w\s])/);
    if (!emojiMatch || !emojiMatch[1]) continue;

    const emoji = emojiMatch[1];

    // Extract title (between ** markers)
    const titleMatch = trimmed.match(/\*\*([^*]+)\*\*/);
    if (!titleMatch || !titleMatch[1]) continue;

    const title = titleMatch[1].trim();

    // Extract location and distance (line starting with 📍)
    const locationMatch = trimmed.match(/📍\s*([^•]+)•\s*([^\n]+)/);
    const location = locationMatch?.[1]?.trim() ?? 'Location not specified';
    const distance = locationMatch?.[2]?.trim() ?? 'Distance not specified';

    // Extract description (everything after the location line)
    const descMatch = trimmed.match(/📍[^\n]+\n(.+)/s);
    const description = descMatch?.[1]?.trim() ?? trimmed.split('\n').slice(2).join(' ').trim();

    if (emoji && title && description) {
      recommendations.push({
        emoji,
        title,
        description,
        location,
        distance,
      });
    }
  }

  // Fallback: if parsing failed, try simpler approach
  if (recommendations.length === 0) {
    // Split by double newline or numbered list
    const fallbackSections = responseText.split(/\n\n+/);

    for (const section of fallbackSections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      const firstLine = lines[0];
      if (!firstLine) continue;

      const emojiMatch = firstLine.match(/^([^\w\s])/);
      const titleMatch = firstLine.match(/\*\*([^*]+)\*\*/);

      if (emojiMatch?.[1] && titleMatch?.[1]) {
        recommendations.push({
          emoji: emojiMatch[1],
          title: titleMatch[1].trim(),
          description: lines.slice(1).join(' ').trim(),
          location: 'See description',
          distance: 'See description',
        });
      }
    }
  }

  return recommendations.slice(0, 5); // Ensure exactly 5 recommendations
}

// POST /api/recommend endpoint
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const formData: ActivityFormData = req.body;

    // Comprehensive input validation

    // 1. Validate city
    if (!formData.city || typeof formData.city !== 'string') {
      res.status(400).json({ error: 'City is required and must be a string' });
      return;
    }
    if (formData.city.trim().length === 0 || formData.city.length > 100) {
      res.status(400).json({ error: 'City must be between 1 and 100 characters' });
      return;
    }
    if (!/^[a-zA-Z\s\-'.]+$/.test(formData.city)) {
      res.status(400).json({ error: 'City contains invalid characters' });
      return;
    }

    // 2. Validate state
    if (!formData.state || typeof formData.state !== 'string') {
      res.status(400).json({ error: 'State is required and must be a string' });
      return;
    }
    const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
    if (!validStates.includes(formData.state.toUpperCase())) {
      res.status(400).json({ error: 'State must be a valid US state code (e.g., CA, NY, TX)' });
      return;
    }

    // 3. Validate zipCode (optional)
    if (formData.zipCode) {
      if (typeof formData.zipCode !== 'string') {
        res.status(400).json({ error: 'Zip code must be a string' });
        return;
      }
      if (!/^\d{5}$/.test(formData.zipCode)) {
        res.status(400).json({ error: 'Zip code must be a 5-digit number' });
        return;
      }
    }

    // 4. Validate ages
    if (!formData.ages || !Array.isArray(formData.ages) || formData.ages.length === 0) {
      res.status(400).json({ error: 'Ages is required and must be a non-empty array' });
      return;
    }
    if (formData.ages.length > 10) {
      res.status(400).json({ error: 'Cannot specify more than 10 ages' });
      return;
    }
    for (const age of formData.ages) {
      if (typeof age !== 'number' || !Number.isInteger(age)) {
        res.status(400).json({ error: 'All ages must be integers' });
        return;
      }
      if (age < 0 || age > 18) {
        res.status(400).json({ error: 'All ages must be between 0 and 18' });
        return;
      }
    }

    // 5. Validate date
    if (!formData.date || typeof formData.date !== 'string') {
      res.status(400).json({ error: 'Date is required and must be a string' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
      return;
    }
    const dateObj = new Date(formData.date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      res.status(400).json({ error: 'Date is not a valid date' });
      return;
    }
    // Allow dates up to 1 year in the past (for flexibility) and up to 1 year in the future
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (dateObj < oneYearAgo || dateObj > oneYearFromNow) {
      res.status(400).json({ error: 'Date must be within one year from today' });
      return;
    }

    // 6. Validate timeSlot
    if (!formData.timeSlot || typeof formData.timeSlot !== 'string') {
      res.status(400).json({ error: 'Time slot is required and must be a string' });
      return;
    }
    const validTimeSlots = ['all_day', 'morning', 'afternoon', 'evening', 'night'];
    if (!validTimeSlots.includes(formData.timeSlot)) {
      res.status(400).json({ error: 'Time slot must be one of: all_day, morning, afternoon, evening, night' });
      return;
    }

    // 7. Validate distance
    if (!formData.distance || typeof formData.distance !== 'number') {
      res.status(400).json({ error: 'Distance is required and must be a number' });
      return;
    }
    if (!Number.isFinite(formData.distance) || formData.distance < 1 || formData.distance > 50) {
      res.status(400).json({ error: 'Distance must be between 1 and 50 miles' });
      return;
    }

    // 8. Validate preferences (optional)
    if (formData.preferences !== undefined && formData.preferences !== null) {
      if (typeof formData.preferences !== 'string') {
        res.status(400).json({ error: 'Preferences must be a string' });
        return;
      }
      if (formData.preferences.length > 500) {
        res.status(400).json({ error: 'Preferences must be 500 characters or less' });
        return;
      }
    }

    console.log('📥 Received request:', formData);

    // Initialize Anthropic client (create fresh client for each request)
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build prompt
    const prompt = buildPrompt(formData);

    console.log('🔍 Calling Claude API with web search...');

    // Call Claude API with web search
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      ],
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('✅ Claude API response received');

    // Extract text from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    console.log('📝 Response text:', responseText.substring(0, 200) + '...');

    // Parse recommendations
    const recommendations = parseRecommendations(responseText);

    console.log(`📊 Parsed ${recommendations.length} recommendations`);

    if (recommendations.length === 0) {
      console.error('Parse error - raw response:', responseText);
      res.status(500).json({
        error: 'Unable to process recommendations. Please try again with different search criteria.',
      });
      return;
    }

    // Return recommendations
    const response: RecommendResponse = { recommendations };
    res.json(response);

  } catch (error) {
    console.error('❌ Error:', error);

    if (error instanceof Anthropic.APIError) {
      console.error('Claude API Error details:', error.message, error.status);
      res.status(error.status || 500).json({
        error: 'Unable to fetch activity recommendations. Please try again later.',
      });
      return;
    }

    console.error('Internal error details:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});

export default router;
