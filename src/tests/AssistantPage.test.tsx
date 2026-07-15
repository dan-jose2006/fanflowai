/**
 * Integration tests for the AssistantPage component.
 *
 * Tests cover:
 *   - Rendering & initial state
 *   - Empty input prevention
 *   - Loading state display
 *   - Success path (AI response)
 *   - Failure path (network error → deterministic fallback)
 *   - Duplicate-request prevention
 *   - Navigation via suggested prompts
 *   - Accessibility (accessible labels present)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AssistantPage from '../pages/AssistantPage';

// Mock SiriOrb to avoid WebGL errors in jsdom
vi.mock('../components/SiriOrb', () => ({
  SiriOrb: () => <div data-testid="siri-orb" aria-hidden="true" />,
}));

// Mock AILoading similarly
vi.mock('../components/AILoading', () => ({
  AILoading: () => <div data-testid="ai-loading" aria-hidden="true" />,
}));

// Mock framer-motion to avoid animation/WebGL complexity in jsdom
// All helpers defined inline to prevent vi.mock hoisting issues.
vi.mock('framer-motion', () => {
  const fwd =
    (Tag: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, initial, animate, exit, layoutId, transition, ...rest }: any) =>
      React.createElement(Tag, rest, children);
  return {
    motion: { div: fwd('div'), span: fwd('span'), section: fwd('section') },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

// Mock the API_BASE config
vi.mock('../config/api', () => ({ API_BASE: 'http://localhost:8000' }));

const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  globalThis.fetch = mockFetch;
});

const renderPage = () => render(<AssistantPage />);

const getInput = () => screen.getByLabelText(/ask fanflow ai/i);
const getSendBtn = () => screen.getByRole('button', { name: /send message/i });

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('AssistantPage rendering', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /ask fanflow ai/i })).toBeInTheDocument();
  });

  it('shows the initial greeting from FanFlow AI', () => {
    renderPage();
    expect(screen.getByText(/World Cup stadium assistant/i)).toBeInTheDocument();
  });

  it('renders the text input with accessible label', () => {
    renderPage();
    expect(getInput()).toBeInTheDocument();
  });

  it('renders suggested prompt buttons', () => {
    renderPage();
    expect(screen.getByLabelText(/find nearest restroom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/food wait times/i)).toBeInTheDocument();
  });
});

// ── Empty input prevention ────────────────────────────────────────────────────

describe('Empty input prevention', () => {
  it('disables the send button when input is empty', () => {
    renderPage();
    expect(getSendBtn()).toBeDisabled();
  });

  it('enables the send button when there is text', async () => {
    renderPage();
    await userEvent.type(getInput(), 'hello');
    expect(getSendBtn()).not.toBeDisabled();
  });

  it('does not call fetch when input is whitespace only', async () => {
    renderPage();
    await userEvent.type(getInput(), '   ');
    await userEvent.click(getSendBtn());
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── Emergency — immediate response (no fetch) ─────────────────────────────────

describe('Emergency bypass', () => {
  it('responds immediately to emergency messages without calling the API', async () => {
    renderPage();
    await userEvent.type(getInput(), 'I need medical help');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      expect(screen.getByText(/Emergency/i)).toBeInTheDocument();
    });
    // Emergency path should NOT make a fetch call
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('Loading state', () => {
  it('shows loading indicator while awaiting AI response', async () => {
    // Never resolve to keep loading state visible.
    // Use a phrase with no deterministic keywords so the LLM path is always taken.
    mockFetch.mockReturnValue(new Promise(() => {}));

    renderPage();
    await userEvent.type(getInput(), 'What is the history of this stadium?');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      expect(screen.getByTestId('ai-loading')).toBeInTheDocument();
    });
  });
});

// ── Success path ─────────────────────────────────────────────────────────────

describe('Success path', () => {
  it('displays the AI response on successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: 'Food Court B is open with a 4-minute wait.',
        confidence_score: 0.92,
        reasoning: 'Based on current telemetry.',
        context_factors: ['Role: fan'],
        suggested_actions: [],
      }),
    });

    renderPage();
    await userEvent.type(getInput(), 'food court wait time?');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      expect(screen.getByText(/4-minute wait/i)).toBeInTheDocument();
    });
  });

  it('clears the input after sending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: 'OK',
        confidence_score: 0.9,
        context_factors: [],
        suggested_actions: [],
      }),
    });

    renderPage();
    const input = getInput();
    await userEvent.type(input, 'hello');
    await userEvent.click(getSendBtn());

    await waitFor(() => expect(input).toHaveValue(''));
  });
});

// ── Failure / fallback path ───────────────────────────────────────────────────

describe('Failure path — deterministic fallback', () => {
  it('shows a fallback response when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    renderPage();
    await userEvent.type(getInput(), 'where is the restroom?');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      // The decision engine fallback for restroom queries
      expect(screen.getByText(/Restroom/i)).toBeInTheDocument();
    });
  });

  it('shows simulated-data badge on fallback responses', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderPage();
    await userEvent.type(getInput(), 'parking info please');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      expect(screen.getByText(/Simulated data/i)).toBeInTheDocument();
    });
  });

  it('shows the error alert banner on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Offline'));

    renderPage();
    await userEvent.type(getInput(), 'food?');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ── Duplicate-request prevention ─────────────────────────────────────────────

describe('Duplicate-request prevention', () => {
  it('disables send button while a request is in flight', async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

    renderPage();
    await userEvent.type(getInput(), 'food?');
    await userEvent.click(getSendBtn());

    await waitFor(() => {
      // Button should be disabled while isTyping=true
      expect(getSendBtn()).toBeDisabled();
    });
  });
});

// ── Suggested prompts navigation ──────────────────────────────────────────────

describe('Suggested prompts', () => {
  it('sends a suggested prompt when clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: 'Restroom is nearby.',
        confidence_score: 0.9,
        context_factors: [],
        suggested_actions: [],
      }),
    });

    renderPage();
    const promptBtn = screen.getByLabelText(/find nearest restroom/i);
    await userEvent.click(promptBtn);

    // The user message should appear in chat — check for the article with the user message
    await waitFor(() => {
      const userMessages = screen.getAllByText('Find nearest restroom');
      // At least 2 matches: the button text + the user chat message
      expect(userMessages.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('Accessibility', () => {
  it('has a labelled form', () => {
    renderPage();
    expect(screen.getByRole('form', { name: /send a message/i })).toBeInTheDocument();
  });

  it('conversation section has aria-live', () => {
    renderPage();
    const section = screen.getByRole('region', { name: /conversation/i });
    expect(section).toHaveAttribute('aria-live', 'polite');
  });

  it('send button has an accessible name', () => {
    renderPage();
    expect(getSendBtn()).toHaveAccessibleName('Send message');
  });

  it('reasoning toggle button has aria-expanded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: 'Crowd is low at Gate C.',
        confidence_score: 0.88,
        reasoning: 'Based on live sensors.',
        context_factors: ['Role: fan'],
        suggested_actions: [],
      }),
    });

    renderPage();
    await userEvent.type(getInput(), 'crowd?');
    await userEvent.click(getSendBtn());

    const toggle = await screen.findByRole('button', { name: /why this recommendation/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
