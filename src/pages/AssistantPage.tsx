import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, User, ArrowRight, ShieldCheck, Info, ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AILoading } from '../components/AILoading';
import { SiriOrb } from '../components/SiriOrb';
import { API_BASE } from '../config/api';
import { runDecisionEngine } from '../services/decisionEngine';
import type { ChatMessage, UserContext, ChatApiResponse } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const LOADING_STATES = [
  'Analyzing stadium telemetry…',
  'Checking crowd density…',
  'Evaluating weather conditions…',
  'Optimizing routes…',
  'Generating recommendation…',
] as const;

const SUGGESTED_PROMPTS = [
  'Find nearest restroom',
  'Food wait times',
  'Crowd density at North Gate',
] as const;

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_MESSAGE_LENGTH = 300;

// ── Sub-components ────────────────────────────────────────────────────────────

interface ReasoningPaneProps {
  msg: ChatMessage;
}

const AIReasoningPane = ({ msg }: ReasoningPaneProps) => {
  const [expanded, setExpanded] = useState(false);
  if (!msg.reasoning && !msg.confidenceScore) return null;

  return (
    <div className="mt-3 text-sm text-slate-300">
      <div className="flex items-center gap-4 flex-wrap">
        {msg.confidenceScore !== undefined && (
          <div
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-500/20"
            aria-label={`AI confidence: ${Math.round(msg.confidenceScore * 100)}%`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Confidence: {Math.round(msg.confidenceScore * 100)}%
          </div>
        )}
        {msg.isFallback && (
          <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-500/20">
            <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
            Simulated data — AI offline
          </div>
        )}
        {(msg.reasoning || (msg.contextFactors && msg.contextFactors.length > 0)) && (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={`reasoning-${msg.id}`}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifa-primary rounded"
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            Why this recommendation?
            {expanded ? (
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`reasoning-${msg.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3 text-[13px] backdrop-blur-sm">
              {msg.reasoning && (
                <p className="text-slate-200 leading-relaxed">{msg.reasoning}</p>
              )}
              {msg.contextFactors && msg.contextFactors.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <span className="font-medium text-slate-400 block mb-2 text-xs uppercase tracking-wider">
                    Context Applied:
                  </span>
                  <ul className="flex flex-wrap gap-2" role="list">
                    {msg.contextFactors.map((factor, idx) => (
                      <li
                        key={idx}
                        className="bg-white/10 border border-white/5 px-2.5 py-1 rounded-md text-slate-200 text-xs"
                      >
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const AssistantPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hello! I'm **FanFlow AI** — your World Cup stadium assistant. How can I help you today?",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState<string>(LOADING_STATES[0]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isRequestInFlight = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (!isTyping) {
      setTypingText(LOADING_STATES[0]);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_STATES.length;
      setTypingText(LOADING_STATES[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isRequestInFlight.current) return;

      // Prevent duplicate calls
      isRequestInFlight.current = true;
      setError(null);
      setMessages((prev) => [...prev, { id: Date.now(), text: trimmed, isBot: false }]);
      setInput('');
      setIsTyping(true);

      // Build typed user context (TODO: wire to actual user profile)
      const userContext: UserContext = {
        persona: 'fan',
        language: 'en',
        accessibilityNeeds: 'none',
        crowdLevel: 'normal',
        emergencyState: 'none',
      };

      // 1. Run deterministic engine first
      const deterministic = runDecisionEngine(trimmed, userContext);

      // For emergency — reply immediately without waiting for LLM
      if (deterministic.confidence >= 1.0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: deterministic.response,
            isBot: true,
            confidence_score: deterministic.confidence,
            confidenceScore: deterministic.confidence,
            contextFactors: deterministic.contextFactors,
            isFallback: false,
          },
        ]);
        setIsTyping(false);
        isRequestInFlight.current = false;
        return;
      }

      // 2. Try the Groq-backed AI endpoint
      abortRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortRef.current?.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${API_BASE}/api/v1/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: trimmed.slice(0, MAX_MESSAGE_LENGTH),
            persona: userContext.persona,
            language: userContext.language,
          }),
        });

        if (!response.ok) throw new Error(`API error ${response.status}`);

        const data: ChatApiResponse = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.response,
            isBot: true,
            reasoning: data.reasoning,
            confidenceScore: data.confidence_score,
            contextFactors: data.context_factors,
            isFallback: false,
          },
        ]);
      } catch (err) {
        // 3. Fallback: use deterministic result when AI is unavailable
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        const fallbackText = deterministic.matched
          ? deterministic.response
          : `I'm temporarily offline. ${deterministic.response}`;

        if (!isAbort) {
          // Only show error notice for genuine network failures, not timeouts
          setError('AI backend is unavailable — showing simulated response.');
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: fallbackText,
            isBot: true,
            confidenceScore: deterministic.confidence,
            contextFactors: deterministic.contextFactors,
            isFallback: true,
          },
        ]);
      } finally {
        clearTimeout(timeoutId);
        setIsTyping(false);
        isRequestInFlight.current = false;
      }
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col relative px-4"
      aria-label="FanFlow AI Assistant"
    >
      {/* Page Header */}
      <header className="py-6 text-center">
        <h1 className="text-xl md:text-2xl font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-fifa-primary" aria-hidden="true" />
          Ask FanFlow AI
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Vertical: Smart stadium operations · Powered by Groq LLaMA
        </p>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            role="alert"
            aria-live="polite"
            className="mb-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 flex items-center gap-2"
          >
            <TriangleAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <section
        className="flex-1 overflow-y-auto hide-scrollbar pb-32"
        aria-label="Conversation"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        <div className="space-y-8 py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${msg.isBot ? '' : 'flex-row-reverse'}`}
                role="article"
                aria-label={msg.isBot ? 'FanFlow AI message' : 'Your message'}
              >
                {msg.isBot ? (
                  <SiriOrb size="32px" animationDuration={8} />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-white/10 text-slate-300"
                    aria-hidden="true"
                  >
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
                <div className="flex flex-col max-w-[80%] md:max-w-[70%]">
                  <div
                    className={`leading-relaxed text-[15px] md:text-base px-5 py-3.5 ${
                      msg.isBot
                        ? 'text-slate-200'
                        : 'bg-fifa-card backdrop-blur-md border border-white/10 rounded-2xl shadow-xl'
                    }`}
                  >
                    <span
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-white font-semibold">$1</strong>'
                        ),
                      }}
                    />
                  </div>
                  {msg.isBot && <AIReasoningPane msg={msg} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
              aria-live="polite"
              aria-label={typingText}
            >
              <SiriOrb size="32px" animationDuration={8} />
              <div className="px-5 flex items-center h-[52px] gap-3">
                <AILoading />
                <motion.span
                  key={typingText}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-slate-400 font-medium italic"
                  aria-hidden="true"
                >
                  {typingText}
                </motion.span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" aria-hidden="true" />
        </div>
      </section>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {/* Suggested Prompts */}
          <div
            className="flex gap-2 overflow-x-auto hide-scrollbar pb-1"
            role="list"
            aria-label="Suggested questions"
          >
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                role="listitem"
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-4 py-2 rounded-full glass-panel text-xs md:text-sm text-slate-300 hover:text-white transition-all hover-lift shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifa-primary"
                aria-label={`Ask: ${prompt}`}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="relative flex items-center"
            aria-label="Send a message"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Ask FanFlow AI
            </label>
            <input
              id="assistant-input"
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              placeholder="Ask FanFlow AI…"
              aria-label="Your message"
              aria-describedby="input-hint"
              maxLength={MAX_MESSAGE_LENGTH}
              className="w-full glass-card rounded-[32px] pl-6 pr-14 py-4 md:py-5 text-[15px] md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-fifa-primary/70 transition-all text-white placeholder-slate-500 shadow-2xl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="absolute right-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifa-primary"
            >
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </form>
          <p id="input-hint" className="text-center text-[10px] text-slate-500 font-medium">
            AI can make mistakes. Verify critical safety information with stadium staff.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AssistantPage;
