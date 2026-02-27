import { createMiddleware } from 'hono/factory';
import { v4 as uuidv4 } from 'uuid';

export const requestId = createMiddleware(async (c, next) => {
  const id = c.req.header('x-request-id') || uuidv4();
  c.header('x-request-id', id);
  c.set('requestId', id);
  await next();
});
