export interface Dealer {
  id: string;
  name: string;
  code: string; // dealer code
  metro_area: string;
  postal_prefix: string;
  address: string;
  phone: string;
  capabilities: string[]; // e.g. ['ev_certified', 'commercial_fleet']
  latitude: number;
  longitude: number;
}

export interface FSRSlot {
  id: string;
  dealer_id: string;
  date: string; // ISO date
  time_block: string; // 'morning' | 'afternoon'
  capacity: number;
  booked: number;
  score?: number; // computed by FSR broker
}

export interface BookingDraft {
  id: string;
  vin_id: string;
  dealer_id: string;
  slot_id: string;
  status: BookingStatus;
  reason: string; // auto-composed from lead state
  contact: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'draft' | 'held' | 'exported';
