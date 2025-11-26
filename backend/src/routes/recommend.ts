import { Router, Request, Response } from 'express';
import type { ActivityFormData, RecommendResponse, LLMProvider, OutputFormat } from '../shared/types';
import type { LLMProvider as LLMProviderInstance } from '../services/llm-providers/types';
import { TIME_SLOTS } from '../shared/constants';
import { validateCityName, validateState, validateZipCode, validateAges } from '../shared/validators';
import { createProvider, isProviderAvailable, getAvailableProviders } from '../services/llm-providers/factory';
import { sanitizeErrorMessage } from '../shared/utils/sanitize';
import { withTimeout } from '../shared/utils/timeout';

const router = Router();

// Debug logging flag - set DEBUG_LOGGING=true in .env to enable verbose logs
const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true';

/**
 * Get output format from environment variable
 * Reads OUTPUT_FORMAT from .env file (defaults to 'markdown' if not set)
 * @returns OutputFormat - either 'markdown' or 'json'
 */
const getOutputFormat = (): OutputFormat => {
  const envFormat = process.env.OUTPUT_FORMAT?.toLowerCase();
  return (envFormat === 'json' ? 'json' : 'markdown') as OutputFormat;
};

/**
 * POST /api/recommend endpoint
 * Fetches activity recommendations from a single AI provider
 * Validates input data and returns structured recommendations
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const formData: ActivityFormData = req.body;
    
    // Validate that formData exists
    if (!formData) {
      res.status(400).json({ error: 'Request body is required' });
      return;
    }

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

    // 9. Validate provider (optional, defaults to 'anthropic')
    if (formData.provider !== undefined && formData.provider !== null) {
      if (typeof formData.provider !== 'string') {
        res.status(400).json({ error: 'Provider must be a string' });
        return;
      }
      const validProviders: LLMProvider[] = ['anthropic', 'perplexity', 'gemini'];
      if (!validProviders.includes(formData.provider as LLMProvider)) {
        res.status(400).json({ error: `Provider must be one of: ${validProviders.join(', ')}` });
        return;
      }
    }

    if (DEBUG_LOGGING) {
      console.log('\n========== REQUEST RECEIVED ==========');
      console.log('Form Data:', JSON.stringify(formData, null, 2));
      console.log('========================================\n');
    } else {
      console.log('📥 Received request:', formData);
    }

    // Determine provider (default to anthropic)
    const providerId: LLMProvider = formData.provider || 'anthropic';

    // Validate provider is available
    if (!isProviderAvailable(providerId)) {
      res.status(400).json({
        error: `Provider "${providerId}" is not available. Please ensure the API key is configured.`,
      });
      return;
    }

    // Create provider instance
    const provider = createProvider(providerId);
    console.log(`🤖 Using provider: ${provider.getProviderId()} (${provider.getModelName()})`);

    // Generate recommendations using the selected provider with timeout (60 seconds)
    // Output format is now configured via environment variable
    const recommendations = await withTimeout(
      provider.generateRecommendations(formData, {
        outputFormat: getOutputFormat(),
      }),
      60000, // 60 second timeout
      `Request to ${provider.getProviderId()} timed out after 60 seconds`
    );

    console.log(`📊 Generated ${recommendations.length} recommendations`);

    if (DEBUG_LOGGING) {
      console.log('\n========== RECOMMENDATIONS GENERATED ==========');
      console.log('Count:', recommendations.length);
      recommendations.forEach((rec, index) => {
        console.log(`\nRecommendation ${index + 1}:`);
        console.log(`  Emoji: ${rec.emoji}`);
        console.log(`  Title: ${rec.title}`);
        console.log(`  Location: ${rec.location}`);
        console.log(`  Distance: ${rec.distance}`);
        console.log(`  Description: ${rec.description.substring(0, 100)}...`);
      });
      console.log('\n==============================================\n');
    }

    // Return recommendations
    const response: RecommendResponse = { recommendations };
    res.json(response);

  } catch (error) {
    console.error('❌ Error:', error);

    // Handle provider-specific errors
    if (error instanceof Error) {
      // Check for API key errors
      if (error.message.includes('API_KEY') || error.message.includes('environment variable')) {
        res.status(500).json({
          error: 'API key not configured. Please contact support.',
        });
        return;
      }

      // Check for provider-specific errors
      if (error.message.includes('Perplexity') || error.message.includes('Gemini') || error.message.includes('Anthropic')) {
        const providerId = (req.body as ActivityFormData)?.provider || 'provider';
        res.status(500).json({
          error: `Unable to fetch activity recommendations from ${providerId}. Please try again later.`,
        });
        return;
      }

      // Generic error - sanitize error message before sending to client
      res.status(500).json({
        error: sanitizeErrorMessage(error, DEBUG_LOGGING),
      });
      return;
    }

    console.error('Internal error details:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      error: sanitizeErrorMessage(error, false),
    });
  }
});

/**
 * POST /api/recommend/all endpoint
 * Fetches activity recommendations from all available AI providers in parallel
 * Uses Promise.allSettled to ensure all providers are queried even if some fail
 * Returns an array of results with provider info, recommendations, or error details
 */
router.post('/recommend/all', async (req: Request, res: Response) => {
  try {
    const formData: Omit<ActivityFormData, 'provider'> = req.body;
    
    // Validate that formData exists
    if (!formData) {
      res.status(400).json({ error: 'Request body is required' });
      return;
    }

    // Reuse validation logic from /recommend endpoint
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

    // Get all available providers
    const availableProviders = getAvailableProviders();
    
    if (availableProviders.length === 0) {
      res.status(400).json({
        error: 'No AI providers are available. Please ensure at least one API key is configured.',
      });
      return;
    }

    console.log(`🔄 Requesting recommendations from ${availableProviders.length} providers in parallel...`);

    // Make parallel requests to all providers using Promise.allSettled
    const results = await Promise.allSettled(
      availableProviders.map(async (providerId) => {
        let provider: LLMProviderInstance | null = null;
        let modelName = 'Unknown';
        
        try {
          // Create provider instance first to get model name
          provider = createProvider(providerId);
          modelName = provider.getModelName();
          
          // Generate recommendations with timeout (60 seconds per provider)
          const recommendations = await withTimeout(
            provider.generateRecommendations(formData, {
              outputFormat: getOutputFormat(),
            }),
            60000, // 60 second timeout per provider
            `Request to ${providerId} timed out after 60 seconds`
          );
          
          return {
            provider: providerId,
            modelName,
            recommendations,
          };
        } catch (error) {
          // Capture error details (without stack trace for security)
          const errorMessage = sanitizeErrorMessage(error, DEBUG_LOGGING);
          // Only include safe error information - exclude stack traces in production
          const fullErrorResponse = error instanceof Error ? {
            name: error.name,
            message: sanitizeErrorMessage(error, DEBUG_LOGGING),
            // Stack traces are only included in debug mode for security
            ...(DEBUG_LOGGING ? { stack: error.stack } : {}),
          } : { error: sanitizeErrorMessage(error, false) };
          
          // Use model name from provider if available, otherwise try to get it safely
          if (!provider) {
            try {
              provider = createProvider(providerId);
              modelName = provider.getModelName();
            } catch (providerError) {
              // If provider creation fails, use fallback model name
              modelName = `${providerId} (model name unavailable)`;
            }
          } else {
            // Provider was created but error occurred, get model name
            modelName = provider.getModelName();
          }
          
          return {
            provider: providerId,
            modelName,
            error: errorMessage,
            fullErrorResponse,
          };
        }
      })
    );

    // Transform results into response format
    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // This shouldn't happen since we catch errors inside, but handle it just in case
        const providerId = availableProviders[index];
        const reason = result.reason;
        const errorMessage = sanitizeErrorMessage(reason, DEBUG_LOGGING);
        // Only include safe error information - exclude stack traces in production
        const safeErrorResponse = reason instanceof Error ? {
          name: reason.name,
          message: sanitizeErrorMessage(reason, DEBUG_LOGGING),
          // Stack traces are only included in debug mode for security
          ...(DEBUG_LOGGING ? { stack: reason.stack } : {}),
        } : { error: sanitizeErrorMessage(reason, false) };
        
        return {
          provider: providerId,
          modelName: 'Unknown',
          error: errorMessage,
          fullErrorResponse: safeErrorResponse,
        };
      }
    });

    console.log(`✅ Completed parallel requests: ${response.filter(r => 'recommendations' in r && r.recommendations).length} succeeded, ${response.filter(r => 'error' in r && r.error).length} failed`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error in /recommend/all:', error);
    res.status(500).json({
      error: sanitizeErrorMessage(error, DEBUG_LOGGING),
    });
  }
});

export default router;
