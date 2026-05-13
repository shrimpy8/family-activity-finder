export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: 'AUTH' | 'TIMEOUT' | 'RATE_LIMIT' | 'UNAVAILABLE' | 'UNKNOWN',
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
