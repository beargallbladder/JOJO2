import { Hono } from 'hono';
import { getAvailableSlots } from '../services/fsr-broker.js';

export const fsrRoute = new Hono();

fsrRoute.post('/availability', async (c) => {
  const body = await c.req.json();
  const { dealer_ids, preferred_dealer_id, home_area } = body;

  if (!dealer_ids?.length) {
    return c.json({ error: 'dealer_ids required' }, 400);
  }

  const slots = await getAvailableSlots({ dealer_ids, preferred_dealer_id, home_area });
  return c.json({ slots });
});
