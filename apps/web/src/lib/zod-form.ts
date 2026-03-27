import type { ZodError } from 'zod';

/** Single-line message for banners or alerts. */
export function formatZodError(error: ZodError): string {
  return error.issues
    .map((i) => {
      const path = i.path.length ? `${i.path.join('.')}: ` : '';
      return `${path}${i.message}`;
    })
    .join('; ');
}

/** First message per dot-path for inline hints. */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_root';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
