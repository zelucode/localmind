export function logWarn(category: string, message: string, err?: unknown) {
  console.warn(`[${category}] ${message}`, err);
}

export function logError(category: string, message: string, err?: unknown) {
  console.error(`[${category}] ${message}`, err);
}
