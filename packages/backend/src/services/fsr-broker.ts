import { db } from '../config/database.js';
import { fsrSlots, dealerDirectory } from '../db/schema.js';
import { eq, and, gt, inArray } from 'drizzle-orm';

interface FSRQuery {
  dealer_ids: string[];
  preferred_dealer_id?: string;
  home_area?: string;
}

export async function getAvailableSlots(query: FSRQuery) {
  const availableSlots = await db
    .select({
      slot: fsrSlots,
      dealer: dealerDirectory,
    })
    .from(fsrSlots)
    .innerJoin(dealerDirectory, eq(fsrSlots.dealer_id, dealerDirectory.id))
    .where(
      and(
        inArray(fsrSlots.dealer_id, query.dealer_ids),
        gt(fsrSlots.capacity, fsrSlots.booked)
      )
    );

  // Score each slot per FSR broker algorithm
  const now = new Date();
  const scored = availableSlots.map(({ slot, dealer }) => {
    let score = 0;

    // Preferred dealer bonus
    if (query.preferred_dealer_id && dealer.id === query.preferred_dealer_id) {
      score += 0.3;
    }

    // Earlier time bonus (max 0.25, linear decay over 14 days)
    const slotDate = new Date(slot.date);
    const daysDiff = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 0.25 * (1 - daysDiff / 14));

    // Distance bucket (approximate by postal prefix match)
    if (query.home_area && dealer.postal_prefix === query.home_area) {
      score += 0.2; // Same area = closest
    } else {
      score += 0.05;
    }

    // Capacity present
    if (slot.capacity - slot.booked > 0) {
      score += 0.15;
    }

    return { ...slot, dealer, score: Math.round(score * 1000) / 1000 };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
