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

    // Validate required fields
    if (!formData.city || !formData.state || !formData.ages || formData.ages.length === 0 || !formData.date || !formData.timeSlot) {
      res.status(400).json({
        error: 'Missing required fields: city, state, ages, date, and timeSlot are required',
      });
      return;
    }

    // Validate distance
    if (!formData.distance || formData.distance <= 0) {
      res.status(400).json({
        error: 'Distance must be greater than 0',
      });
      return;
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
      res.status(500).json({
        error: 'Failed to parse recommendations from Claude response',
        rawResponse: responseText,
      });
      return;
    }

    // Return recommendations
    const response: RecommendResponse = { recommendations };
    res.json(response);

  } catch (error) {
    console.error('❌ Error:', error);

    if (error instanceof Anthropic.APIError) {
      res.status(error.status || 500).json({
        error: `Claude API Error: ${error.message}`,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
