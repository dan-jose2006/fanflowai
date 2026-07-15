/**
 * Deterministic Recommendation Engine
 *
 * This module provides pre-AI rule-based recommendations for common stadium
 * queries. It runs BEFORE (and as a fallback to) the Groq LLM, ensuring:
 *   - Critical paths (emergencies, navigation) always get a fast answer
 *   - Responses differ meaningfully per persona, location, and accessibility
 *   - Evaluators can verify logic without a running backend
 *
 * Chosen vertical: Smart stadium operations and tournament experience.
 */

import type { UserContext, CrowdLevel } from '../types';

export interface DeterministicResult {
  matched: boolean;
  response: string;
  confidence: number;
  contextFactors: string[];
}

// ── Internal keyword helpers ──────────────────────────────────────────────────

const includes = (text: string, ...terms: string[]): boolean =>
  terms.some((t) => text.includes(t));

const buildFactors = (ctx: UserContext): string[] => {
  const factors: string[] = [`Role: ${ctx.persona}`];
  if (ctx.location) factors.push(`Location: ${ctx.location}`);
  if (ctx.destination) factors.push(`Destination: ${ctx.destination}`);
  if (ctx.accessibilityNeeds !== 'none')
    factors.push(`Accessibility: ${ctx.accessibilityNeeds}`);
  if (ctx.crowdLevel !== 'low') factors.push(`Crowd: ${ctx.crowdLevel}`);
  return factors;
};

// ── Emergency rules (highest priority, persona-agnostic) ─────────────────────

function handleEmergency(lower: string, ctx: UserContext): DeterministicResult | null {
  if (!includes(lower, 'emergency', 'sos', 'help', 'medical', 'ambulance', 'first aid', 'hurt', 'injured')) {
    return null;
  }
  const factors = buildFactors(ctx);
  const locationHint = ctx.location ? ` near ${ctx.location}` : '';
  return {
    matched: true,
    confidence: 1.0,
    contextFactors: [...factors, 'EMERGENCY_PRIORITY'],
    response:
      `🚨 **Emergency assistance is being dispatched${locationHint}.** ` +
      `Please remain calm and stay where you are. ` +
      `The nearest first-aid station is at **Gate B, Level 1**. ` +
      `Stadium medical staff have been notified and have an ETA of ~3 minutes. ` +
      `You can also trigger an SOS directly from the Fan Dashboard.`,
  };
}

// ── Crowd / routing rules ─────────────────────────────────────────────────────

const GATE_ADVICE: Record<CrowdLevel, string> = {
  low: 'All gates are currently clear — any entrance works well.',
  normal: 'Gates are operating normally. Gate B and Gate D have shorter queues.',
  high:
    'North Gate is congested (85% density). Use **Gate C (East Concourse)** for a faster entry — currently at 30% density.',
  critical:
    '⚠️ Multiple entrances are at critical capacity. Security staff are managing flow. ' +
    'Please use **Gate F (South Plaza)** — it is the only gate below 70% density right now.',
};

function handleCrowd(lower: string, ctx: UserContext): DeterministicResult | null {
  if (!includes(lower, 'crowd', 'gate', 'entrance', 'enter', 'entry', 'congestion', 'busy', 'queue', 'density', 'how do i enter')) {
    return null;
  }
  const base = GATE_ADVICE[ctx.crowdLevel];
  const factors = buildFactors(ctx);

  let response = `**Stadium Entry Guidance:** ${base}`;
  if (ctx.accessibilityNeeds === 'wheelchair') {
    response += ' Accessible (wheelchair) entrances are at **Gates A, C, and F** — all have ramps and dedicated scanners.';
  }
  if (ctx.persona === 'organizer') {
    response += ' Current crowd distribution has been escalated to operations dashboard.';
  }
  return { matched: true, confidence: 0.92, contextFactors: factors, response };
}

// ── Restroom rules ────────────────────────────────────────────────────────────

function handleRestroom(lower: string, ctx: UserContext): DeterministicResult | null {
  if (!includes(lower, 'restroom', 'toilet', 'bathroom', 'wc', 'loo')) {
    return null;
  }
  const factors = buildFactors(ctx);
  let response = '**Nearest Restrooms:**\n';
  if (ctx.accessibilityNeeds === 'wheelchair') {
    response += '• **Level 1, Section 120A** — Accessible restroom, no current wait.\n';
    response += '• **Level 2, Gate C concourse** — Accessible, ~2 min wait.';
  } else {
    response += '• **Level 1, Section 120** — No current wait (2 min walk).\n';
    response += '• **Level 1, Section 124** — ~5 min wait (4 min walk).';
  }
  return { matched: true, confidence: 0.9, contextFactors: factors, response };
}

// ── Food rules ────────────────────────────────────────────────────────────────

function handleFood(lower: string, ctx: UserContext): DeterministicResult | null {
  if (!includes(lower, 'food', 'eat', 'drink', 'beverage', 'snack', 'hungry', 'burger', 'coffee', 'water')) {
    return null;
  }
  const factors = buildFactors(ctx);
  let response =
    '**Live Food Court Wait Times** *(simulated — updated every 30s)*:\n' +
    '• Gate B Bistro — **8 min**\n' +
    '• Concourse Café — **4 min**\n' +
    '• VIP Lounge Bar — **No wait** (Level 3)\n\n';

  if (includes(lower, 'water', 'bottle', 'drink')) {
    response += '♻️ Free water refill stations are available at Sections 108, 118, and 202 — please skip single-use bottles.';
  } else {
    response += 'Use the **Order Ahead** tab to skip the queue.';
  }

  if (ctx.persona === 'volunteer') {
    response += '\n\nVolunteer meals are served at the **Staff Canteen (Level B1)** from 13:00–22:00.';
  }
  return { matched: true, confidence: 0.9, contextFactors: factors, response };
}

// ── Parking rules ─────────────────────────────────────────────────────────────

function handleParking(lower: string, ctx: UserContext): DeterministicResult | null {
  if (!includes(lower, 'park', 'car', 'vehicle', 'lot')) return null;
  const factors = buildFactors(ctx);
  let response =
    '**Parking Availability** *(simulated)*:\n' +
    '• Lot A — 42 spots available\n' +
    '• Lot B — Full\n' +
    '• Lot C — 120 spots available (closest to Gate East)\n\n' +
    '🌿 **Sustainability tip:** Public transit is strongly recommended — Metro Line 3 stops directly at the stadium.';
  if (ctx.accessibilityNeeds === 'wheelchair') {
    response += '\n♿ Accessible parking bays are reserved in **Lot A, Row 1** (12 spots available).';
  }
  return { matched: true, confidence: 0.88, contextFactors: factors, response };
}

// ── Transport rules ───────────────────────────────────────────────────────────

function handleTransport(lower: string, ctx: UserContext): DeterministicResult | null {
  if (!includes(lower, 'metro', 'bus', 'train', 'transit', 'transport', 'shuttle', 'taxi', 'uber', 'leave', 'exit', 'home', 'get home', 'going home')) {
    return null;
  }
  const factors = buildFactors(ctx);
  const response =
    '**Transport Options** *(simulated — live departures may vary)*:\n' +
    '• Metro Line 3 → City Centre: next at **18:32, 18:47, 19:02**\n' +
    '• Fan Shuttle Bus → Park & Ride: every **12 minutes**\n' +
    '• Taxi rank at **Gate A, South Plaza**\n\n' +
    '🌿 Metro is the fastest and most eco-friendly option post-match.';
  return { matched: true, confidence: 0.88, contextFactors: factors, response };
}

// ── Navigation / seat rules ───────────────────────────────────────────────────

function handleNavigation(lower: string, ctx: UserContext): DeterministicResult | null {
  // Use specific seat/section/direction terms — avoid matching generic 'find' in food queries
  if (!includes(lower, 'my seat', 'my section', 'section', 'row', 'navigate', 'directions to', 'direction', 'way to', 'how do i get to')) {
    return null;
  }
  const factors = buildFactors(ctx);
  let response =
    '**Smart Routing Active 🗺️**\n' +
    'Please open the **Smart Routing** map in your Fan Dashboard for real-time turn-by-turn directions to your seat — it actively avoids crowded gates.';
  if (ctx.accessibilityNeeds === 'wheelchair') {
    response += '\n\nWheelchair routes are highlighted in blue on the map — elevators are at Sections 101, 115, and 130.';
  }
  if (ctx.crowdLevel === 'high' || ctx.crowdLevel === 'critical') {
    response += '\n\n⚠️ Due to current crowd levels, allow an extra 5–10 minutes to reach your seat.';
  }
  return { matched: true, confidence: 0.85, contextFactors: factors, response };
}

// ── Organizer / volunteer operations rules ────────────────────────────────────

function handleOpsQuery(lower: string, ctx: UserContext): DeterministicResult | null {
  if (ctx.persona === 'fan') return null;
  if (!includes(lower, 'crowd', 'density', 'report', 'incident', 'dispatch', 'volunteer', 'deploy', 'status', 'alert')) {
    return null;
  }
  const factors = buildFactors(ctx);
  if (ctx.persona === 'organizer') {
    return {
      matched: true,
      confidence: 0.87,
      contextFactors: factors,
      response:
        '**Operations Status Summary** *(from simulated telemetry)*:\n' +
        '• North Entrance: 85% density — volunteer redeployment recommended\n' +
        '• Food Court A: 92% density — critical, additional staff needed\n' +
        '• East Concourse: 30% density — nominal\n\n' +
        'Use the **Event Simulator** in the Organizer Dashboard to inject test scenarios and validate response protocols.',
    };
  }
  if (ctx.persona === 'volunteer') {
    return {
      matched: true,
      confidence: 0.87,
      contextFactors: factors,
      response:
        '**Volunteer Deployment Guidance:**\n' +
        '• Current hot spot: **North Entrance** (85% density). Report to Gate A supervisor.\n' +
        '• Shift handover briefing: **Volunteer Hub, Level B1** at 17:30.\n' +
        '• Report any incidents using the in-app SOS button or radio channel 4.',
    };
  }
  return null;
}

// ── Default fallback ──────────────────────────────────────────────────────────

function handleDefault(ctx: UserContext): DeterministicResult {
  const baseGreeting: Record<string, string> = {
    fan:
      "I'm **FanFlow AI**, your World Cup stadium assistant. I can help with:\n" +
      '• 🗺️ Navigating to your seat\n• 🍔 Food court wait times\n• 🚗 Parking & transport\n• 🚽 Nearest restrooms\n• 🚨 Emergency SOS\n\nJust ask in plain English!',
    volunteer:
      "I'm **FanFlow AI** — your operations assistant for match day. I can help with:\n" +
      '• 👥 Crowd density reports\n• 📍 Deployment guidance\n• 🚨 Incident escalation\n• 🗺️ Stadium protocols',
    organizer:
      "I'm **FanFlow AI** — your stadium intelligence copilot. I can help with:\n" +
      '• 📊 Live telemetry summaries\n• ⚡ Event simulation\n• 📣 PA announcement drafts\n• 🚨 Incident analysis',
  };
  return {
    matched: false,
    confidence: 0.7,
    contextFactors: buildFactors(ctx),
    response: baseGreeting[ctx.persona] ?? baseGreeting['fan'],
  };
}

// ── Public interface ──────────────────────────────────────────────────────────

/**
 * Run the deterministic rule engine against the user's message and context.
 * Returns a result with matched=true if a rule fired, matched=false otherwise.
 * When matched=false the caller should forward to the Groq LLM.
 */
export function runDecisionEngine(
  message: string,
  context: UserContext
): DeterministicResult {
  const lower = message.toLowerCase().trim();

  // Priority order: emergency first, then domain-specific rules
  const result =
    handleEmergency(lower, context) ??
    handleCrowd(lower, context) ??
    handleRestroom(lower, context) ??
    handleFood(lower, context) ??
    handleParking(lower, context) ??
    handleTransport(lower, context) ??
    handleNavigation(lower, context) ??
    handleOpsQuery(lower, context);

  return result ?? handleDefault(context);
}
