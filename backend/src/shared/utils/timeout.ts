/**
 * Timeout utility for async operations
 */

/**
 * Create a promise that rejects after a specified timeout
 * @param ms - Timeout in milliseconds
 * @param message - Error message to throw on timeout
 * @returns Promise that rejects after timeout
 */
function createTimeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Wrap an async function with a timeout
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
  return Promise.race([
    promise,
    createTimeout(ms, errorMessage),
  ]);
}

