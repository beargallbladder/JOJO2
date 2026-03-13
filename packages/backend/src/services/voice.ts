import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

const PILLAR_FRIENDLY: Record<string, string> = {
  short_trip_density: 'short trips',
  ota_stress: 'software updates',
  cold_soak: 'cold weather exposure',
  cranking_degradation: 'starting performance',
  hmi_reset: 'driver reset',
  service_record: 'dealer service record',
  parts_purchase: 'parts purchase',
  cohort_prior: 'fleet pattern',
};

const VIN_SYSTEM_PROMPT = `You are a Ford Vehicle Health assistant. You help dealers and service advisors understand what's going on with a specific vehicle — clearly, warmly, and without jargon.

Your job is to translate technical vehicle health data into language a dealer service advisor would use when talking to a customer, or that an owner could understand on their phone.

Rules:
- Talk like a knowledgeable friend, not a robot. Use natural sentences.
- Never say "posterior probability" — say "risk level" or "likelihood."
- Never say "confidence score" — say "how sure we are" or "evidence strength."
- Never say "staleness index" — say "how recent the data is" or "freshness."
- Reference evidence in plain English: "short trips," "cold weather," "starting health," "dealer service records," "parts purchases," "software updates," "fleet patterns."
- When evidence is missing, explain WHY it matters: "We haven't seen a service record yet, which is why we're not fully confident."
- Be honest about uncertainty. If confidence is low, say so directly.
- End with a clear, practical suggestion the dealer or owner can act on.
- Keep it conversational. 3-5 sentences max unless asked for detail.

Example of good output:
"This F-150 has been flagged because the battery is showing signs of wear — mostly from a lot of short trips and some cold weather stress. We're about 70% sure this needs attention, but we haven't seen a dealer service record yet, so we're holding off on sending an alert. If the owner comes in for anything else, it'd be worth checking the battery while it's there."`;

const FLEET_SYSTEM_PROMPT = `You are a Ford Vehicle Health assistant helping fleet managers understand their vehicle risk landscape — clearly, practically, and without jargon.

Rules:
- Talk like a knowledgeable advisor. Natural language, not report-speak.
- Reference vehicles by model and last 4 of VIN when available.
- Say "high risk" not "elevated posterior." Say "we're confident" not "C score above threshold."
- Explain what's driving the risk in plain terms (short trips, cold weather, missing service records, etc).
- Prioritize actionable advice: which vehicles to look at first, what to schedule, what can wait.
- Keep it concise. 3-5 sentences for overview, more if asked.

Example of good output:
"You've got three trucks that need attention soon — two F-150s with battery concerns from heavy short-trip use, and an Explorer where we flagged an oil change that might not have actually happened. The Explorer is the priority because we haven't seen a service record and the oil quality still looks off. The rest of the fleet looks good."`;

function friendlyPillar(name: string): string {
  return PILLAR_FRIENDLY[name] || name.replace(/_/g, ' ');
}

function safeFallback(params: { scope: 'vin' | 'fleet'; message: string; context: Record<string, unknown> }) {
  if (params.scope === 'vin') {
    const ctx: any = params.context || {};
    const vin = ctx.vin || {};
    const pillars = Array.isArray(ctx.pillars) ? ctx.pillars : [];
    const governance = Array.isArray(ctx.governance) ? ctx.governance : [];

    const presentPillars = pillars
      .filter((p: any) => p.pillar_state === 'present')
      .slice(-3)
      .map((p: any) => friendlyPillar(p.pillar_name));
    const absentPillars = pillars
      .filter((p: any) => p.pillar_state === 'absent')
      .slice(-2)
      .map((p: any) => friendlyPillar(p.pillar_name));

    const p = Number(vin.posterior_p ?? 0);
    const c = Number(vin.posterior_c ?? 0);
    const vehicle = `${vin.year || ''} ${vin.make || ''} ${vin.model || ''}`.trim() || 'this vehicle';
    const riskWord = p >= 0.8 ? 'high' : p >= 0.6 ? 'elevated' : p >= 0.3 ? 'moderate' : 'low';
    const confWord = c >= 0.7 ? "pretty confident" : c >= 0.5 ? "moderately confident" : "not very confident yet";

    const drivers = presentPillars.length > 0
      ? `The main factors are ${presentPillars.join(' and ')}.`
      : 'We don\'t have strong evidence pointing in any one direction yet.';
    const gaps = absentPillars.length > 0
      ? `We're still waiting on ${absentPillars.join(' and ')}, which would help us be more certain.`
      : '';
    const action = governance.length > 0
      ? `Right now the system has it marked as "${(governance[0].action_type || '').replace(/_/g, ' ')}."` 
      : p >= 0.7
        ? 'If this vehicle comes in for anything, it would be worth taking a look.'
        : 'No action needed right now — we\'re just keeping an eye on it.';

    return `This ${vehicle} is showing ${riskWord} risk, and we're ${confWord} about that call. ${drivers} ${gaps} ${action}`.trim();
  }

  const ctx: any = params.context || {};
  const top = Array.isArray(ctx.top_leads) ? ctx.top_leads : [];
  const top3 = top.slice(0, 3).map((v: any) => {
    const model = v.model || v.vin_code?.slice(-4) || 'vehicle';
    const risk = Number(v.p ?? 0) >= 0.7 ? 'high risk' : 'elevated';
    return `${model} (${risk})`;
  });

  if (top3.length === 0) return 'The fleet looks healthy right now. No vehicles need immediate attention.';
  return `You've got ${top3.length} vehicles that need attention: ${top3.join(', ')}. I'd start with the first one on the list — that's where the strongest signal is. The rest of the fleet is looking normal.`;
}

export async function* streamVoiceResponse(params: {
  scope: 'vin' | 'fleet';
  message: string;
  context: Record<string, unknown>;
}): AsyncGenerator<{ type: 'text' | 'done' | 'error'; content: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    yield { type: 'text', content: safeFallback(params) };
    yield { type: 'done', content: '' };
    return;
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const systemPrompt = params.scope === 'vin' ? VIN_SYSTEM_PROMPT : FLEET_SYSTEM_PROMPT;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Context data:\n${JSON.stringify(params.context, null, 2)}\n\nUser question: ${params.message}`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', content: event.delta.text };
      }
    }
    yield { type: 'done', content: '' };
  } catch (err: any) {
    const msg = err?.message || 'Voice streaming failed';
    if (msg.includes('authentication_error') || msg.includes('invalid') || msg.includes('401')) {
      yield { type: 'text', content: safeFallback(params) };
      yield { type: 'done', content: '' };
      return;
    }
    yield { type: 'error', content: msg };
  }
}
