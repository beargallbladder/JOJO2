export interface GovernanceAction {
  id: string;
  vin_id: string;
  action_type: string; // e.g. 'recommend_service', 'hold', 'escalate', 'suppress'
  reason: string;
  triggered_by: string; // rule or system that triggered
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MemoryRecord {
  id: string;
  vin_id: string;
  record_type: string; // 'observation', 'correction', 'feedback'
  content: string;
  source: string;
  created_at: string;
}
