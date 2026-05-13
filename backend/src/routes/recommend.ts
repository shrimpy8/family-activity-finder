import { Router, Request, Response } from 'express';
import type { ActivityFormData, RecommendResponse, LLMProvider } from '../shared/types';
import type { LLMProvider as LLMProviderInstance } from '../services/llm-providers/types';
import { isValidTimeSlot } from '../shared/constants/timeSlots';
import { validateCityName, validateState, validateZipCode, validateAges, validateDate } from '../shared/validators';
import { createProvider, isProviderAvailable, getAvailableProviders } from '../services/llm-providers/factory';
import { sanitizeErrorMessage } from '../shared/utils/sanitize';
import { withTimeout } from '../shared/utils/timeout';
import { DEBUG_LOGGING, OUTPUT_FORMAT, LLM_TIMEOUT_MS } from '../shared/config';

const router = Router();

type ValidationResult =
  | { valid: true; data: ActivityFormData }
  | { valid: false; error: string };

/**
 * Validate and normalise request body into ActivityFormData.
 * Returns the validated data or a user-facing error string.
 */
function validateFormData(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const formData = body as Record<string, unknown>;

  const cityError = validateCityName(formData.city as string | undefined);
  if (cityError) return { valid: false, error: cityError };

  const stateError = validateState(formData.state as string | undefined);
  if (stateError) return { valid: false, error: stateError };

  const zipCodeError = validateZipCode(formData.zipCode as string | undefined);
  if (zipCodeError) return { valid: false, error: zipCodeError };

  const agesError = validateAges(formData.ages as number[] | undefined);
  if (agesError) return { valid: false, error: agesError };

  const dateError = validateDate(formData.date as string);
  if (dateError) return { valid: false, error: dateError };

  if (!formData.timeSlot || typeof formData.timeSlot !== 'string') {
    return { valid: false, error: 'Time slot is required and must be a string' };
  }
  if (!isValidTimeSlot(formData.timeSlot as string)) {
    return { valid: false, error: 'Time slot must be one of: all_day, morning, afternoon, evening, night' };
  }

  if (!formData.distance || typeof formData.distance !== 'number') {
    return { valid: false, error: 'Distance is required and must be a number' };
  }
  if (!Number.isFinite(formData.distance) || formData.distance < 1 || formData.distance > 50) {
    return { valid: false, error: 'Distance must be between 1 and 50 miles' };
  }

  if (formData.preferences !== undefined && formData.preferences !== null) {
    if (typeof formData.preferences !== 'string') {
      return { valid: false, error: 'Preferences must be a string' };
    }
    if (formData.preferences.length > 500) {
      return { valid: false, error: 'Preferences must be 500 characters or less' };
    }
  }

  if (formData.provider !== undefined && formData.provider !== null) {
    if (typeof formData.provider !== 'string') {
      return { valid: false, error: 'Provider must be a string' };
    }
    const validProviders: LLMProvider[] = ['anthropic', 'perplexity', 'gemini'];
    if (!validProviders.includes(formData.provider as LLMProvider)) {
      return { valid: false, error: `Provider must be one of: ${validProviders.join(', ')}` };
    }
  }

  return { valid: true, data: body as ActivityFormData };
}

/**
 * POST /api/recommend
 * Fetch activity recommendations from a single AI provider.
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const validation = validateFormData(req.body);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const formData = validation.data;

    if (DEBUG_LOGGING) {
      console.log('\n========== REQUEST RECEIVED ==========');
      console.log('Form Data:', JSON.stringify(formData, null, 2));
      console.log('========================================\n');
    } else {
      console.log('📥 Received request:', { provider: formData.provider, timeSlot: formData.timeSlot });
    }

    const providerId: LLMProvider = formData.provider || 'anthropic';

    if (!isProviderAvailable(providerId)) {
      res.status(400).json({
        error: `Provider "${providerId}" is not available. Please ensure the API key is configured.`,
      });
      return;
    }

    const provider = createProvider(providerId);
    console.log(`🤖 Using provider: ${provider.getProviderId()} (${provider.getModelName()})`);

    const recommendations = await withTimeout(
      provider.generateRecommendations(formData, { outputFormat: OUTPUT_FORMAT }),
      LLM_TIMEOUT_MS,
      `Request to ${provider.getProviderId()} timed out after ${LLM_TIMEOUT_MS / 1000} seconds`
    );

    console.log(`📊 Generated ${recommendations.length} recommendations`);

    if (DEBUG_LOGGING) {
      recommendations.forEach((rec, index) => {
        console.log(`\nRecommendation ${index + 1}: ${rec.emoji} ${rec.title}`);
      });
    }

    const response: RecommendResponse = { recommendations };
    res.json(response);

  } catch (error) {
    console.error('❌ Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('environment variable')) {
        res.status(500).json({ error: 'API key not configured. Please contact support.' });
        return;
      }
      if (error.message.includes('Perplexity') || error.message.includes('Gemini') || error.message.includes('Anthropic')) {
        const providerId = (req.body as ActivityFormData)?.provider || 'provider';
        res.status(500).json({
          error: `Unable to fetch activity recommendations from ${providerId}. Please try again later.`,
        });
        return;
      }
      res.status(500).json({ error: sanitizeErrorMessage(error, DEBUG_LOGGING) });
      return;
    }

    res.status(500).json({ error: sanitizeErrorMessage(error, false) });
  }
});

/**
 * POST /api/recommend/all
 * Fetch activity recommendations from all available AI providers in parallel.
 */
router.post('/recommend/all', async (req: Request, res: Response) => {
  try {
    const validation = validateFormData(req.body);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const formData = validation.data;

    const availableProviders = getAvailableProviders();

    if (availableProviders.length === 0) {
      res.status(400).json({
        error: 'No AI providers are available. Please ensure at least one API key is configured.',
      });
      return;
    }

    console.log(`🔄 Requesting recommendations from ${availableProviders.length} providers in parallel...`);

    const results = await Promise.allSettled(
      availableProviders.map(async (providerId) => {
        let provider: LLMProviderInstance | null = null;
        let modelName = 'Unknown';

        try {
          provider = createProvider(providerId);
          modelName = provider.getModelName();

          const recommendations = await withTimeout(
            provider.generateRecommendations(formData, { outputFormat: OUTPUT_FORMAT }),
            LLM_TIMEOUT_MS,
            `Request to ${providerId} timed out after ${LLM_TIMEOUT_MS / 1000} seconds`
          );

          return { provider: providerId, modelName, recommendations };
        } catch (error) {
          console.error(`Provider ${providerId} error:`, error);
          const errorMessage = sanitizeErrorMessage(error, DEBUG_LOGGING);

          if (!provider) {
            try {
              provider = createProvider(providerId);
              modelName = provider.getModelName();
            } catch {
              modelName = `${providerId} (model name unavailable)`;
            }
          } else {
            modelName = provider.getModelName();
          }

          return { provider: providerId, modelName, error: errorMessage };
        }
      })
    );

    const response = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      const providerId = availableProviders[index];
      console.error(`Provider ${providerId} settled error:`, result.reason);
      return {
        provider: providerId,
        modelName: 'Unknown',
        error: sanitizeErrorMessage(result.reason, DEBUG_LOGGING),
      };
    });

    console.log(`✅ Completed: ${response.filter(r => 'recommendations' in r).length} succeeded, ${response.filter(r => 'error' in r).length} failed`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error in /recommend/all:', error);
    res.status(500).json({ error: sanitizeErrorMessage(error, DEBUG_LOGGING) });
  }
});

export default router;
