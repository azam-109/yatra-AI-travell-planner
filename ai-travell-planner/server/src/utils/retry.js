export async function withRetry(task, { retries = 2, delayMs = 700, label = "operation" } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  lastError.message = `${label} failed after ${retries + 1} attempts: ${lastError.message}`;
  throw lastError;
}
