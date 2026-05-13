/**
 * Timeout utility for async operations
 */

/**
 * Wrap a promise with a timeout. The timer is always cleared when the promise
 * resolves or rejects first, preventing timer leaks in Promise.race.
 * @param promise - Promise to wrap
 * @param ms - Timeout in milliseconds (default: 60000 = 60 seconds)
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that rejects if timeout is exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 60000,
  errorMessage: string = 'Request timeout: The operation took too long to complete'
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

