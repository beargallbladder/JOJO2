'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { staggers } from '@/lib/motion';
import type { GovernanceAction } from '@gravity/shared';
import type { ServiceSuggestion } from '@gravity/shared';

interface GovernancePanelProps {
  governance: GovernanceAction[];
  suggestion: ServiceSuggestion | null;
}

const actionIcons: Record<string, string> = {
  recommend_service: '→',
  hold: '⏸',
  escalate: '↑',
  suppress: '×',
};

const urgencyStyles: Record<string, string> = {
  immediate: 'bg-risk-critical/10 text-risk-critical border-risk-critical/20',
  soon: 'bg-risk-high/10 text-risk-high border-risk-high/20',
  routine: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20',
  none: 'bg-gravity-surface text-gravity-text-secondary border-gravity-border',
};

export function GovernancePanel({ governance, suggestion }: GovernancePanelProps) {
  return (
    <div>
      {/* Service suggestion */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-lg border mb-4',
            urgencyStyles[suggestion.urgency]
          )}
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1">
            Service {suggestion.recommended ? 'Recommended' : 'Not Required'}
          </div>
          <div className="text-sm">{suggestion.reason}</div>
        </motion.div>
      )}

      {/* Governance actions */}
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-3">
        Governance Actions
      </div>
      <div className="space-y-2">
        {governance.length === 0 && (
          <div className="text-sm text-gravity-text-whisper">No governance actions recorded.</div>
        )}
        {governance.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * staggers.fast }}
            className="flex items-start gap-3 p-3 bg-gravity-surface rounded-lg border border-gravity-border"
          >
            <span className="text-lg leading-none mt-0.5">
              {actionIcons[action.action_type] || '•'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gravity-text">
                  {action.action_type.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-gravity-text-whisper font-mono">
                  {formatDate(action.created_at)}
                </span>
              </div>
              <p className="text-xs text-gravity-text-secondary mt-0.5">{action.reason}</p>
              <p className="text-[10px] text-gravity-text-whisper mt-1">Triggered by: {action.triggered_by}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
