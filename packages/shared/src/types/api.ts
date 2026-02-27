import type { Vin, PillarEvent, PosteriorSnapshot, RiskBand, Subsystem } from './vin';
import type { Dealer, FSRSlot, BookingDraft } from './dealer';
import type { GovernanceAction } from './governance';

// Leads
export interface LeadsQuery {
  subsystem?: Subsystem;
  band?: RiskBand;
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: Vin[];
  total: number;
  page: number;
  limit: number;
}

// VIN Detail
export interface VinDetailResponse {
  vin: Vin;
  pillars: PillarEvent[];
  timeline: PosteriorSnapshot[];
  governance: GovernanceAction[];
  service_suggestion: ServiceSuggestion | null;
}

export interface ServiceSuggestion {
  recommended: boolean;
  urgency: 'immediate' | 'soon' | 'routine' | 'none';
  reason: string;
}

// Preferences
export interface VinPreferencesRequest {
  home_area?: string;
  preferred_dealer_id?: string;
  use_preferred_first?: boolean;
}

// Dealers
export interface DealerSearchQuery {
  home_area?: string;
  vin_id?: string;
  max?: number;
}

export interface DealerSearchResponse {
  dealers: Dealer[];
}

// FSR
export interface FSRAvailabilityRequest {
  vin_id: string;
  dealer_ids: string[];
  preferred_dealer_id?: string;
  home_area?: string;
}

export interface FSRAvailabilityResponse {
  slots: (FSRSlot & { dealer: Dealer })[];
}

// Booking
export interface BookingDraftRequest {
  vin_id: string;
  dealer_id: string;
  slot_id: string;
  contact?: Record<string, string>;
}

export interface BookingDraftResponse {
  booking: BookingDraft;
}

export interface BookingHoldRequest {
  booking_id: string;
}

export interface BookingHoldResponse {
  booking: BookingDraft;
}
