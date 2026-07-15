/**
 * Unit tests for the deterministic recommendation engine.
 *
 * These tests verify that each branch of the rule engine produces
 * the correct response for different user contexts and messages.
 * No network calls, no mocks — pure logic tests.
 */

import { describe, it, expect } from 'vitest';
import { runDecisionEngine } from '../services/decisionEngine';
import type { UserContext } from '../types';

// ── Test context factories ────────────────────────────────────────────────────

const fanCtx = (): UserContext => ({
  persona: 'fan',
  language: 'en',
  accessibilityNeeds: 'none',
  crowdLevel: 'normal',
  emergencyState: 'none',
});

const organizerCtx = (): UserContext => ({
  persona: 'organizer',
  language: 'en',
  accessibilityNeeds: 'none',
  crowdLevel: 'high',
  emergencyState: 'none',
});

const volunteerCtx = (): UserContext => ({
  persona: 'volunteer',
  language: 'en',
  accessibilityNeeds: 'none',
  crowdLevel: 'normal',
  emergencyState: 'none',
});

const wheelchairCtx = (): UserContext => ({
  ...fanCtx(),
  accessibilityNeeds: 'wheelchair',
});

// ── Emergency rules ───────────────────────────────────────────────────────────

describe('Emergency handling', () => {
  it('matches "I need medical help" and returns confidence 1.0', () => {
    const result = runDecisionEngine('I need medical help', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.confidence).toBe(1.0);
    expect(result.response).toContain('Emergency');
    expect(result.contextFactors).toContain('EMERGENCY_PRIORITY');
  });

  it('matches SOS trigger phrase', () => {
    const result = runDecisionEngine('SOS please help me', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response.toLowerCase()).toContain('emergency');
  });

  it('matches "hurt" and "injured" keywords', () => {
    const r1 = runDecisionEngine('someone is hurt near section 5', fanCtx());
    const r2 = runDecisionEngine('I got injured at the gate', fanCtx());
    expect(r1.matched).toBe(true);
    expect(r2.matched).toBe(true);
  });

  it('is persona-agnostic — organizer also gets emergency response', () => {
    const result = runDecisionEngine('medical emergency at north stand', organizerCtx());
    expect(result.matched).toBe(true);
    expect(result.confidence).toBe(1.0);
  });
});

// ── Crowd / gate routing ──────────────────────────────────────────────────────

describe('Crowd and gate routing', () => {
  it('returns crowd density advice for fan asking about gate', () => {
    const result = runDecisionEngine('which gate is least busy?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Entry Guidance');
  });

  it('includes critical gate advice when crowd level is critical', () => {
    const ctx = { ...fanCtx(), crowdLevel: 'critical' as const };
    const result = runDecisionEngine('entrance congestion?', ctx);
    expect(result.response).toContain('Gate F');
  });

  it('includes accessible gate info for wheelchair users', () => {
    const result = runDecisionEngine('how do I enter the stadium?', wheelchairCtx());
    expect(result.matched).toBe(true);
    expect(result.response.toLowerCase()).toContain('accessible');
  });
});

// ── Restrooms ─────────────────────────────────────────────────────────────────

describe('Restroom guidance', () => {
  it('matches "where is the toilet?"', () => {
    const result = runDecisionEngine('where is the toilet?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Restroom');
  });

  it('returns accessible restroom info for wheelchair context', () => {
    const result = runDecisionEngine('nearest bathroom please', wheelchairCtx());
    expect(result.matched).toBe(true);
    expect(result.response.toLowerCase()).toContain('accessible');
  });
});

// ── Food ─────────────────────────────────────────────────────────────────────

describe('Food guidance', () => {
  it('matches food queries and returns wait times', () => {
    const result = runDecisionEngine('I am hungry, where can I eat?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Wait Times');
  });

  it('promotes eco-friendly water refill stations when water is mentioned', () => {
    const result = runDecisionEngine('I need water', fanCtx());
    expect(result.response.toLowerCase()).toContain('refill');
  });

  it('gives volunteer-specific meal info', () => {
    const result = runDecisionEngine('where can I eat?', volunteerCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Staff Canteen');
  });
});

// ── Parking ───────────────────────────────────────────────────────────────────

describe('Parking guidance', () => {
  it('matches "where can I park my car?"', () => {
    const result = runDecisionEngine('where can I park my car?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Parking');
  });

  it('mentions accessible bays for wheelchair users', () => {
    const result = runDecisionEngine('parking?', wheelchairCtx());
    expect(result.response.toLowerCase()).toContain('accessible');
  });
});

// ── Transport ─────────────────────────────────────────────────────────────────

describe('Transport guidance', () => {
  it('matches metro and transit queries', () => {
    const result = runDecisionEngine('when is the next metro?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Metro');
  });

  it('promotes eco-friendly transport', () => {
    const result = runDecisionEngine('when is the next shuttle?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response.toLowerCase()).toContain('eco');
  });
});

// ── Navigation / seats ────────────────────────────────────────────────────────

describe('Navigation and seating', () => {
  it('matches seat-finding queries', () => {
    const result = runDecisionEngine('what are directions to my section?', fanCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Smart Routing');
  });

  it('warns about crowd impact on travel time during high crowd', () => {
    const ctx = { ...fanCtx(), crowdLevel: 'high' as const };
    const result = runDecisionEngine('directions to my section', ctx);
    expect(result.matched).toBe(true);
    expect(result.response).toContain('extra');
  });
});

// ── Organizer / Volunteer ops ─────────────────────────────────────────────────

describe('Operations queries by persona', () => {
  it('gives organizer-specific operational summary', () => {
    // 'dispatch alert' hits ops handler not the crowd handler
    const result = runDecisionEngine('dispatch an alert to the volunteer team', organizerCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Operations Status');
  });

  it('gives volunteer deployment guidance', () => {
    // 'deploy volunteers' hits volunteer ops handler
    const result = runDecisionEngine('where should I deploy volunteers?', volunteerCtx());
    expect(result.matched).toBe(true);
    expect(result.response).toContain('Volunteer');
  });

  it('does NOT match ops query for a fan asking about crowd', () => {
    // Fan crowd queries should match the crowd handler, not the ops handler
    const result = runDecisionEngine('crowd status at north gate', fanCtx());
    expect(result.matched).toBe(true);
    // Should NOT be the ops response
    expect(result.response).not.toContain('Operations Status Summary');
  });
});

// ── Default / unmatched ───────────────────────────────────────────────────────

describe('Default / unmatched responses', () => {
  it('returns unmatched result with persona-specific greeting for unknown queries', () => {
    const fanResult = runDecisionEngine('tell me a joke', fanCtx());
    expect(fanResult.matched).toBe(false);
    expect(fanResult.response).toContain('FanFlow AI');

    const orgResult = runDecisionEngine('tell me a joke', organizerCtx());
    expect(orgResult.matched).toBe(false);
    expect(orgResult.response).toContain('copilot');
  });

  it('includes persona in context factors', () => {
    const result = runDecisionEngine('hello', fanCtx());
    expect(result.contextFactors.some((f) => f.includes('fan'))).toBe(true);
  });
});

// ── Context factor propagation ────────────────────────────────────────────────

describe('Context factor propagation', () => {
  it('includes location in context factors when provided', () => {
    const ctx: UserContext = { ...fanCtx(), location: 'Gate A' };
    const result = runDecisionEngine('where is the restroom?', ctx);
    expect(result.contextFactors.some((f) => f.includes('Gate A'))).toBe(true);
  });

  it('includes accessibility in context factors when relevant', () => {
    const result = runDecisionEngine('nearest restroom', wheelchairCtx());
    expect(result.contextFactors.some((f) => f.includes('wheelchair'))).toBe(true);
  });
});
