import { useState } from 'react';
import { Accessibility, Eye, Map, Globe, Ear } from 'lucide-react';
import { motion } from 'framer-motion';

const AccessibilityPage = () => {
  const [largeText, setLargeText] = useState(localStorage.getItem('largeText') === 'true');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');
  const [voiceAssist, setVoiceAssist] = useState(localStorage.getItem('voiceAssist') !== 'false');

  const toggleLargeText = () => {
    const val = !largeText;
    localStorage.setItem('largeText', String(val));
    setLargeText(val);
    window.dispatchEvent(new Event('accessibility-change'));
  };

  const toggleHighContrast = () => {
    const val = !highContrast;
    localStorage.setItem('highContrast', String(val));
    setHighContrast(val);
    window.dispatchEvent(new Event('accessibility-change'));
  };

  const toggleVoiceAssist = () => {
    const val = !voiceAssist;
    localStorage.setItem('voiceAssist', String(val));
    setVoiceAssist(val);
    window.dispatchEvent(new Event('accessibility-change'));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`max-w-5xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 ${largeText ? 'text-lg' : ''}`}
    >
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-bold mb-3 tracking-tight flex items-center justify-center md:justify-start gap-4">
          <div className="p-4 glass-panel rounded-[20px] shadow-lg">
            <Accessibility className="w-8 h-8 text-fifa-primary" aria-hidden="true" />
          </div>
          Accessibility Hub
        </h1>
        <p className="text-slate-400 text-lg">Making the World Cup experience seamless for everyone.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="glass-card p-6 md:p-8 rounded-[24px] space-y-6 h-fit">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 tracking-tight">
            <Eye className="w-6 h-6 text-fifa-primary" />
            Display Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-white/5 rounded-[16px] border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <div className="font-bold text-slate-100 mb-1">Large Text</div>
                <div className="text-sm text-slate-400">Increase font size across the app</div>
              </div>
              <button 
                onClick={toggleLargeText}
                className={`w-14 h-8 rounded-full p-1 transition-colors relative shadow-inner ${largeText ? 'bg-fifa-primary' : 'bg-slate-700'}`}
              >
                <motion.div 
                  layout
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                  initial={false}
                  animate={{ x: largeText ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-5 bg-white/5 rounded-[16px] border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <div className="font-bold text-slate-100 mb-1">High Contrast</div>
                <div className="text-sm text-slate-400">Maximize visual readability</div>
              </div>
              <button 
                onClick={toggleHighContrast}
                className={`w-14 h-8 rounded-full p-1 transition-colors relative shadow-inner ${highContrast ? 'bg-fifa-primary' : 'bg-slate-700'}`}
              >
                <motion.div 
                  layout
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                  initial={false}
                  animate={{ x: highContrast ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-5 bg-white/5 rounded-[16px] border border-white/5 hover:bg-white/10 transition-colors">
              <div>
                <div className="font-bold text-slate-100 mb-1">Voice Assistance</div>
                <div className="text-sm text-slate-400">Enable screen reader announcements</div>
              </div>
              <button 
                onClick={toggleVoiceAssist}
                className={`w-14 h-8 rounded-full p-1 transition-colors relative shadow-inner ${voiceAssist ? 'bg-fifa-primary' : 'bg-slate-700'}`}
              >
                <motion.div 
                  layout
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                  initial={false}
                  animate={{ x: voiceAssist ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-5">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 md:p-8 rounded-[24px] flex items-start gap-5 cursor-pointer border-l-4 border-l-fifa-secondary group"
          >
            <div className="p-4 bg-fifa-secondary/10 rounded-2xl shrink-0 group-hover:bg-fifa-secondary/20 transition-colors">
              <Map className="w-6 h-6 text-fifa-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-slate-100">Wheelchair Routes</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">View accessible pathways, dedicated elevators, and ramps throughout the stadium footprint.</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 md:p-8 rounded-[24px] flex items-start gap-5 cursor-pointer border-l-4 border-l-teal-400 group"
          >
            <div className="p-4 bg-teal-400/10 rounded-2xl shrink-0 group-hover:bg-teal-400/20 transition-colors">
              <Ear className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-slate-100">Sensory Rooms</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">Locate quiet zones and sensory-friendly spaces away from crowd noise for a peaceful break.</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 md:p-8 rounded-[24px] flex items-start gap-5 cursor-pointer border-l-4 border-l-blue-400 group"
          >
            <div className="p-4 bg-blue-400/10 rounded-2xl shrink-0 group-hover:bg-blue-400/20 transition-colors">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-slate-100">Multi-language Hub</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">Switch app language and access live AI-powered translation services for announcements.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccessibilityPage;
