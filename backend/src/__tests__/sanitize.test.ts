import { describe, it, expect } from 'vitest';
import { sanitizeForPrompt, sanitizeErrorMessage } from '../shared/utils/sanitize';

describe('sanitizeForPrompt', () => {
  it('passes through clean input unchanged (modulo trim)', () => {
    expect(sanitizeForPrompt('outdoor activities')).toBe('outdoor activities');
  });

  it('strips newlines', () => {
    expect(sanitizeForPrompt('line1\nline2')).toBe('line1 line2');
    expect(sanitizeForPrompt('line1\r\nline2')).toBe('line1 line2');
  });

  it('replaces triple backticks before single backticks', () => {
    const input = '```code``` and `inline`';
    const result = sanitizeForPrompt(input);
    // Triple backticks → ''' and remaining single backticks → '
    expect(result).toBe("'''code''' and 'inline'");
  });

  it('does not leave any backticks in output', () => {
    const result = sanitizeForPrompt('`test` and ```block```');
    expect(result).not.toContain('`');
  });

  it('truncates input exceeding 500 chars', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeForPrompt(long).length).toBeLessThanOrEqual(500);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeForPrompt('')).toBe('');
  });
});

describe('sanitizeErrorMessage', () => {
  it('strips multi-segment file paths', () => {
    const err = new Error('Failed at /home/user/projects/app/index.ts');
    const result = sanitizeErrorMessage(err);
    expect(result).not.toContain('/home/user/projects');
    expect(result).toContain('[path]');
  });

  it('preserves single-slash tokens like 401/Unauthorized', () => {
    const err = new Error('HTTP 401/Unauthorized');
    const result = sanitizeErrorMessage(err);
    expect(result).toContain('401/Unauthorized');
  });

  it('removes API key references', () => {
    const err = new Error('Invalid API_KEY provided');
    const result = sanitizeErrorMessage(err);
    expect(result).toContain('[API_KEY]');
    expect(result).not.toContain('API_KEY provided');
  });

  it('truncates string errors to 200 characters', () => {
    // The string input branch applies the 200-char limit; Error objects use the Error branch
    const result = sanitizeErrorMessage('x'.repeat(300));
    expect(result.length).toBeLessThanOrEqual(203); // 200 + '...'
  });

  it('returns a safe fallback for null/undefined', () => {
    expect(sanitizeErrorMessage(null)).toContain('unexpected error');
    expect(sanitizeErrorMessage(undefined)).toContain('unexpected error');
  });

  it('includes error name when includeDetails is true', () => {
    const err = new TypeError('bad type');
    const result = sanitizeErrorMessage(err, true);
    expect(result).toContain('TypeError');
  });
});
