import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';
import { leadsRoute } from './routes/leads.js';
import { vinRoute } from './routes/vin.js';
import { dealersRoute } from './routes/dealers.js';
import { fsrRoute } from './routes/fsr.js';
import { bookingRoute } from './routes/booking.js';
import { voiceRoute } from './routes/voice.js';

export function createApp() {
  const app = new Hono();

  app.use('*', cors({ origin: '*' }));
  app.use('*', logger());
  app.use('*', requestId);
  app.onError(errorHandler);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/leads', leadsRoute);
  app.route('/vin', vinRoute);
  app.route('/dealers', dealersRoute);
  app.route('/fsr', fsrRoute);
  app.route('/booking', bookingRoute);
  app.route('/voice', voiceRoute);

  return app;
}
