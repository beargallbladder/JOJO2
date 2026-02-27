import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  const status = 'status' in err ? (err as any).status : 500;
  return c.json({ error: err.message || 'Internal Server Error' }, status);
};
