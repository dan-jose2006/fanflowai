import { useState, useRef, useEffect } from 'react';
import { Sparkles, User, ArrowDown, ShieldCheck, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AILoading } from '../components/AILoading';
import { SiriOrb } from '../components/SiriOrb';
import { API_BASE } from '../config/api';

type Message = {
  id: number;
  text: string;
  isBot: boolean;
  reasoning?: string;
  confidenceScore?: number;
  contextFactors?: string[];
};

const loadingStates = [
  "Analyzing stadium telemetry...",
  "Checking crowd density...",
  "Evaluating weather...",
  "Optimizing routes...",
  "Generating recommendation..."
];

const AIReasoningPane = ({ msg }: { msg: Message }) => {
  const [expanded, setExpanded] = useState(false);
  if (!msg.reasoning && !msg.confidenceScore) return null;
  
  return (
    <div className="mt-3 text-sm text-slate-300">
      <div className="flex items-center gap-4">
        {msg.confidenceScore && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Confidence: {Math.round(msg.confidenceScore * 100)}%
          </div>
        )}
        {(msg.reasoning || (msg.contextFactors && msg.contextFactors.length > 0)) && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Why this recommendation?
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3 text-[13px] backdrop-blur-sm">
              {msg.reasoning && <p className="text-slate-200 leading-relaxed">{msg.reasoning}</p>}
              {msg.contextFactors && msg.contextFactors.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <span className="font-medium text-slate-400 block mb-2 text-xs uppercase tracking-wider">Context Applied:</span>
                  <ul className="flex flex-wrap gap-2">
                    {msg.contextFactors.map((factor, idx) => (
                      <li key={idx} className="bg-white/10 border border-white/5 px-2.5 py-1 rounded-md text-slate-200">{factor}</li>
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

const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello. I'm FanFlow AI. How can I assist you with your World Cup experience today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState(loadingStates[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Find nearest restroom",
    "Food wait times",
    "Crowd density at North Gate"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, typingText]);

  useEffect(() => {
    if (isTyping) {
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % loadingStates.length;
        setTypingText(loadingStates[i]);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setTypingText(loadingStates[0]);
    }
  }, [isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now(), text, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          persona: 'fan',
          language: 'en'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: data.response, 
        isBot: true,
        reasoning: data.reasoning,
        confidenceScore: data.confidence_score,
        contextFactors: data.context_factors
      }]);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setMessages(prev => [...prev, { id: Date.now(), text: "I'm sorry, I'm having trouble connecting to the network right now. Please try again later.", isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] flex flex-col relative px-4"
    >
      {/* Header */}
      <header className="py-6 text-center">
        <h1 className="text-xl md:text-2xl font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-fifa-primary" />
          Ask FanFlow AI
        </h1>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
        <div className="space-y-8 py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${msg.isBot ? '' : 'flex-row-reverse'}`}
              >
                {msg.isBot ? (
                  <SiriOrb size="32px" animationDuration={8} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg bg-white/10 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex flex-col max-w-[80%] md:max-w-[70%]">
                  <div className={`leading-relaxed text-[15px] md:text-base px-5 py-3.5 
                    ${msg.isBot 
                      ? 'text-slate-200' 
                      : 'bg-fifa-card backdrop-blur-md border border-white/10 rounded-2xl shadow-xl'
                    }`}>
                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
                  </div>
                  {msg.isBot && <AIReasoningPane msg={msg} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <SiriOrb size="32px" animationDuration={8} />
                <div className="px-5 flex items-center h-[52px] gap-3">
                  <AILoading />
                  <motion.span 
                    key={typingText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-slate-400 font-medium italic"
                  >
                    {typingText}
                  </motion.span>
                </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          
          {/* Suggested Prompts */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-4 py-2 rounded-full glass-panel text-xs md:text-sm text-slate-300 hover:text-white transition-all hover-lift shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FanFlow AI..."
              className="w-full glass-card rounded-[32px] pl-6 pr-14 py-4 md:py-5 text-[15px] md:text-base focus:outline-none focus:ring-1 focus:ring-fifa-primary/50 transition-all text-white placeholder-slate-500 shadow-2xl"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <ArrowDown className="w-5 h-5 -rotate-90" strokeWidth={2.5} />
            </button>
          </form>
          <div className="text-center text-[10px] text-slate-500 font-medium">
            AI can make mistakes. Verify critical safety information.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AssistantPage;
