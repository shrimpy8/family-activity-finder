import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import type { ActivityFormData, Recommendation, RecommendResponse } from '../types';
import { TIME_SLOT_LABELS, TIME_SLOTS } from '../shared/constants';
import { formatDateLong } from '../shared/utils/date';
import { validateCityName, validateState, validateZipCode, validateAges } from '../shared/validators';

const router = Router();

// Debug logging flag - set DEBUG_LOGGING=true in .env to enable verbose logs
const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true';

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
  const dateStr = formatDateLong(date);

  // Convert time slot to human-readable format
  const timeStr = TIME_SLOT_LABELS[timeSlot];

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

  console.log('\n🔍 PARSING RECOMMENDATIONS...');

  // Use regex to match complete recommendation blocks
  // Pattern: emoji + title + location + description
  const recommendationPattern = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][\uFE0F]?)\s*\*\*([^*]+)\*\*\s*\n📍\s*([^•\n]+)•\s*([^\n]+)\s*\n+(.+?)(?=\n[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|$)/gus;

  const matches = [...responseText.matchAll(recommendationPattern)];
  console.log(`📦 Found ${matches.length} recommendation matches`);

  for (const match of matches) {
    // match[1] = emoji
    // match[2] = title
    // match[3] = location
    // match[4] = distance
    // match[5] = description

    if (!match[1] || !match[2] || !match[3] || !match[4] || !match[5]) {
      console.log(`\n❌ Skipped malformed match`);
      continue;
    }

    const emoji = match[1];
    const title = match[2].trim();
    const location = match[3].trim();
    const distance = match[4].trim();
    const description = match[5].trim();

    if (DEBUG_LOGGING) {
      console.log(`\n✅ Parsed recommendation #${recommendations.length + 1}:`);
      console.log(`   Emoji: "${emoji}" (charCode: ${emoji.charCodeAt(0)})`);
      console.log(`   Title: "${title}"`);
      console.log(`   Location: "${location}"`);
      console.log(`   Distance: "${distance}"`);
      console.log(`   Description: "${description.substring(0, 100)}..."`);
    }

    recommendations.push({
      emoji,
      title,
      description,
      location,
      distance,
    });
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

      // Use proper emoji Unicode ranges in fallback too
      const emojiMatch = firstLine.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
      const titleMatch = firstLine.match(/\*\*([^*]+)\*\*/);

      if (emojiMatch?.[1] && titleMatch?.[1]) {
        // Try to extract location and distance from the joined text
        const fullText = lines.slice(1).join('\n');
        const locationMatch = fullText.match(/📍\s*([^•]+)•\s*([^\n]+)/);
        const location = locationMatch?.[1]?.trim() || 'See description';
        const distance = locationMatch?.[2]?.trim() || 'See description';

        // Extract description (text after location line)
        const descMatch = fullText.match(/📍[^\n]+\n(.+)/s);
        const description = descMatch?.[1]?.trim() || fullText.replace(/📍[^\n]+\n?/, '').trim();

        recommendations.push({
          emoji: emojiMatch[1],
          title: titleMatch[1].trim(),
          description: description || fullText,
          location,
          distance,
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
    const cityError = validateCityName(formData.city);
    if (cityError) {
      res.status(400).json({ error: cityError });
      return;
    }

    // 2. Validate state
    const stateError = validateState(formData.state);
    if (stateError) {
      res.status(400).json({ error: stateError });
      return;
    }

    // 3. Validate zipCode (optional)
    const zipCodeError = validateZipCode(formData.zipCode);
    if (zipCodeError) {
      res.status(400).json({ error: zipCodeError });
      return;
    }

    // 4. Validate ages
    const agesError = validateAges(formData.ages);
    if (agesError) {
      res.status(400).json({ error: agesError });
      return;
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
    if (!TIME_SLOTS.includes(formData.timeSlot as any)) {
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

    if (DEBUG_LOGGING) {
      console.log('\n========== FULL CLAUDE RESPONSE ==========');
      console.log(responseText);
      console.log('========== END RESPONSE (length:', responseText.length, 'chars) ==========\n');
    }

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
