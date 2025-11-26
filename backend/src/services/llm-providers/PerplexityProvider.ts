import type { ActivityFormData, Recommendation } from '../../shared/types';
import type { LLMProvider, GenerateOptions } from './types';
import { TIME_SLOT_LABELS } from '../../shared/constants';
import { formatDateLong } from '../../shared/utils/date';
import { sanitizeForPrompt } from '../../shared/utils/sanitize';

const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true';

/**
 * Build prompt from form data (adapted for Perplexity)
 */
function buildPrompt(formData: ActivityFormData): string {
  const { city, state, zipCode, ages, date, timeSlot, distance, preferences } = formData;
  const agesStr = ages.join(', ');
  // Sanitize preferences to prevent prompt injection attacks
  const preferencesStr = preferences ? sanitizeForPrompt(preferences) : 'No specific preferences';

  // Build location string
  const locationStr = zipCode
    ? `${city}, ${state} ${zipCode}`
    : `${city}, ${state}`;

  // Convert date to human-readable format
  const dateStr = formatDateLong(date);

  // Convert time slot to human-readable format
  const timeStr = TIME_SLOT_LABELS[timeSlot];

  return `You are a family activity expert helping parents discover real, current activities for their children.

Search the web for family-friendly activities happening in ${locationStr}, USA that match the following criteria:

Location: ${locationStr}, USA and surrounding areas within ${distance} miles
Children's Ages: ${agesStr} years old
Date: ${dateStr}
Time: ${timeStr}
Preferences: ${preferencesStr}

Instructions:
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

5. Provide exactly 5 recommendations

Output Format:
For each recommendation, provide:

1. Emoji: A single relevant emoji that represents the activity type
2. Title: The venue or event name with timing (e.g., "Museum Name - Sunday 10am-4pm")
3. Location: Specific location or neighborhood name
4. Distance: Approximate distance from ${locationStr} (e.g., "0.5 miles", "2 miles")
5. Description: 2-4 sentences including:
   - What the activity is and what makes it special
   - Key practical details (e.g., "Free admission", "Open 10am-5pm")
   - Why it's great for kids of the specified ages

Format each recommendation EXACTLY as:
[Emoji] **[Activity Title with Timing]**
📍 [Location Name] • [Distance]
[Description paragraph]

Example:
🎨 **Children's Art Workshop at SFMOMA - Saturday 2pm-4pm**
📍 San Francisco Museum of Modern Art • 0.3 miles
The San Francisco Museum of Modern Art hosts hands-on art workshops every Saturday afternoon specifically designed for kids ages 4-10. The free workshops let children create their own masterpieces inspired by current exhibitions. Perfect for creative kids who love getting messy with paint and exploring different art techniques.

Please prioritize:
- Accuracy (verify activities are real and current via web search)
- Diversity (different types of activities, not all museums or all parks)
- Age-appropriateness (genuinely suitable for ${agesStr})
- Practical usefulness (include enough detail for parents to make decisions)

Begin your web search now and provide 5 recommendations.`;
}

/**
 * Parse Perplexity response into structured recommendations
 * Uses same parsing logic as Anthropic since format should be similar
 */
function parseRecommendations(responseText: string): Recommendation[] {
  const recommendations: Recommendation[] = [];

  console.log('\n🔍 PARSING PERPLEXITY RECOMMENDATIONS...');

  // Use regex to match complete recommendation blocks
  // Pattern: emoji + title + location + description
  const recommendationPattern = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][\uFE0F]?)\s*\*\*([^*]+)\*\*\s*\n📍\s*([^•\n]+)•\s*([^\n]+)\s*\n+(.+?)(?=\n[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|$)/gus;

  const matches = [...responseText.matchAll(recommendationPattern)];
  console.log(`📦 Found ${matches.length} recommendation matches`);

  for (const match of matches) {
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
      console.log(`   Emoji: "${emoji}"`);
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
    const fallbackSections = responseText.split(/\n\n+/);

    for (const section of fallbackSections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      const firstLine = lines[0];
      if (!firstLine) continue;

      const emojiMatch = firstLine.match(/^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
      const titleMatch = firstLine.match(/\*\*([^*]+)\*\*/);

      if (emojiMatch?.[1] && titleMatch?.[1]) {
        const fullText = lines.slice(1).join('\n');
        const locationMatch = fullText.match(/📍\s*([^•]+)•\s*([^\n]+)/);
        const location = locationMatch?.[1]?.trim() || 'See description';
        const distance = locationMatch?.[2]?.trim() || 'See description';

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

/**
 * Perplexity Provider implementation
 * Uses Perplexity's chat completions API with search-enabled models
 * Reads model configuration from environment variables (.env file)
 */
export class PerplexityProvider implements LLMProvider {
  private apiKey: string;
  /** API model identifier (e.g., 'sonar') - read from PERPLEXITY_API_MODEL env var */
  private modelName: string;
  private apiUrl: string = 'https://api.perplexity.ai/chat/completions';
  /** Display name for UI (e.g., 'Perplexity Sonar') - read from PERPLEXITY_MODEL_NAME env var */
  private displayName: string;

  /**
   * Initialize Perplexity provider
   * Reads API key and model configuration from environment variables
   * @throws Error if required environment variables are not set or invalid
   */
  constructor() {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
    
    // Read API model name from env, fallback to default
    // Perplexity's online model with web search (alternatives: 'sonar-pro', 'sonar-online')
    const apiModel = process.env.PERPLEXITY_API_MODEL || 'sonar';
    if (!apiModel || typeof apiModel !== 'string' || apiModel.trim().length === 0) {
      throw new Error('PERPLEXITY_API_MODEL environment variable must be a non-empty string');
    }
    this.modelName = apiModel.trim();
    
    // Read display name from env, fallback to default
    const displayModel = process.env.PERPLEXITY_MODEL_NAME || 'Perplexity Sonar';
    if (!displayModel || typeof displayModel !== 'string' || displayModel.trim().length === 0) {
      throw new Error('PERPLEXITY_MODEL_NAME environment variable must be a non-empty string');
    }
    this.displayName = displayModel.trim();
  }

  async generateRecommendations(
    formData: ActivityFormData,
    _options?: GenerateOptions
  ): Promise<Recommendation[]> {
    const prompt = buildPrompt(formData);

    console.log('🔍 Calling Perplexity API with web search...');

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: { message?: string } };
        throw new Error(`Perplexity API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      console.log('✅ Perplexity API response received');

      // Extract text from response
      const responseText = data.choices?.[0]?.message?.content || '';

      if (DEBUG_LOGGING) {
        console.log('\n========== FULL PERPLEXITY RESPONSE ==========');
        console.log(responseText);
        console.log('========== END RESPONSE (length:', responseText.length, 'chars) ==========\n');
      }

      if (!responseText) {
        throw new Error('Empty response from Perplexity API');
      }

      // Parse recommendations
      const recommendations = parseRecommendations(responseText);

      console.log(`📊 Parsed ${recommendations.length} recommendations`);

      if (recommendations.length === 0) {
        throw new Error('Unable to parse recommendations from Perplexity response');
      }

      return recommendations;
    } catch (error) {
      console.error('❌ Perplexity API Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error calling Perplexity API');
    }
  }

  supportsWebSearch(): boolean {
    return true;
  }

  getModelName(): string {
    return this.displayName;
  }

  getProviderId(): string {
    return 'perplexity';
  }
}

