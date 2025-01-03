interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  timeout?: number;
}

export const withRetry = async <T>(
  operation: (signal: AbortSignal) => Promise<T>,
  config: RetryConfig = {},
): Promise<T> => {
  const { maxRetries = 3, initialDelay = 1000, timeout = 5000 } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await operation(controller.signal);
      clearTimeout(timeoutId);

      return result;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, initialDelay * 2 ** attempt),
        );
      }
    }
  }

  console.error(`Operation failed after ${maxRetries} retries`, lastError);
  throw lastError || new Error(`Operation failed after ${maxRetries} retries`);
};
