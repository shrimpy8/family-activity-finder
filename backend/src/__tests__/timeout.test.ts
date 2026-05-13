import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout } from '../shared/utils/timeout';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the promise value when promise wins the race', async () => {
    const promise = Promise.resolve(42);
    const result = await withTimeout(promise, 1000);
    expect(result).toBe(42);
  });

  it('rejects with the timeout error when the timer fires first', async () => {
    const neverResolves = new Promise<never>(() => {/* intentionally never resolves */});
    const resultPromise = withTimeout(neverResolves, 500, 'timed out');

    vi.advanceTimersByTime(600);

    await expect(resultPromise).rejects.toThrow('timed out');
  });

  it('uses a default error message when none is provided', async () => {
    const neverResolves = new Promise<never>(() => {/* intentionally never resolves */});
    const resultPromise = withTimeout(neverResolves, 100);

    vi.advanceTimersByTime(200);

    await expect(resultPromise).rejects.toThrow('timeout');
  });

  it('clears the timer when the promise resolves first (no pending timer)', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    await withTimeout(Promise.resolve('done'), 5000);
    expect(clearSpy).toHaveBeenCalled();
  });

  it('propagates the original rejection when the promise rejects before timeout', async () => {
    const rejection = Promise.reject(new Error('original error'));
    const resultPromise = withTimeout(rejection, 5000);
    await expect(resultPromise).rejects.toThrow('original error');
  });
});
