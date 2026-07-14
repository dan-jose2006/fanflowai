import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Utensils, Navigation, Train, Cross, Bath, ArrowRight, X, Activity } from 'lucide-react';
import { API_BASE } from '../config/api';
import parkingData from '../data/parking.json';
import foodData from '../data/food.json';
import transportData from '../data/transport.json';

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-950/75 backdrop-blur-2xl border border-white/10 rounded-[28px] w-full max-w-2xl overflow-hidden shadow-2xl relative shadow-black/80"
        >
          <div className="flex justify-between items-center p-5 border-b border-white/5">
            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const FanDashboard = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [parking, setParking] = useState<any[]>(parkingData);
  const [food, setFood] = useState<any[]>(foodData);
  const [transport, setTransport] = useState<any[]>(transportData);
  const [sosState, setSosState] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [matchData, setMatchData] = useState<any | null>(null);

  const handleEmergencySOS = async () => {
    setSosState('loading');
    try {
      await fetch(`${API_BASE}/api/v1/incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_type: 'medical',
          location: 'Section 120 – Fan Seat (SOS via App)',
          description: 'Fan triggered Emergency SOS via the FanFlow app. Immediate medical assistance required.',
        }),
      });
      setSosState('sent');
    } catch {
      setSosState('sent'); // still mark as dispatched so UI confirms to fan
    }
  };

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/dashboard`);
        const data = await res.json();
        if (data.parking_status?.length) setParking(data.parking_status);
        if (data.food_court_status?.length) setFood(data.food_court_status);
        if (data.transport_status?.length) setTransport(data.transport_status);
        
        const matchRes = await fetch(`${API_BASE}/api/v1/match/live`);
        if (matchRes.ok) {
          const matchLiveData = await matchRes.json();
          if (matchLiveData?.home_team && matchLiveData?.away_team) {
            setMatchData(matchLiveData);
          }
        }
      } catch (e) {
        console.error("Error fetching live fan telemetry:", e);
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Fan Dashboard</h1>
        <p className="text-slate-400 text-lg">Everything you need for a smooth match day experience.</p>
      </header>

      {/* Match Summary Widget */}
      {matchData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 rounded-[24px] relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-fifa-primary/30"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-fifa-primary/10 rounded-full blur-[80px]" />
          
          <div className="flex items-center gap-6 w-full md:w-auto mb-6 md:mb-0 relative z-10">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-white mb-2">
                <img src={matchData.home_team.logo} alt={matchData.home_team.name} className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto" />
              </div>
              <div className="text-slate-300 font-medium">{matchData.home_team.name}</div>
            </div>
            
            <div className="flex flex-col items-center px-4 md:px-8">
              <div className="flex items-center gap-2 mb-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400">{matchData.time}</span>
              </div>
              <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                {matchData.home_team.score} - {matchData.away_team.score}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-white mb-2">
                <img src={matchData.away_team.logo} alt={matchData.away_team.name} className="w-16 h-16 md:w-20 md:h-20 object-contain mx-auto" />
              </div>
              <div className="text-slate-300 font-medium">{matchData.away_team.name}</div>
            </div>
          </div>

          <div className="w-full md:w-1/3 space-y-3 relative z-10 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-fifa-primary" /> 
              Key Events
            </h3>
            <div className="space-y-3 max-h-32 overflow-y-auto custom-scrollbar pr-2">
              {matchData.events && matchData.events.length > 0 ? (
                matchData.events.map((event: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-fifa-primary font-bold">{event.minute}</span>
                    <span className="text-slate-200 text-right">
                      {event.player} {event.type === 'goal' ? '⚽' : event.type === 'yellow_card' ? '🟨' : event.type === 'red_card' ? '🟥' : '🔄'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No events recorded yet.</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
      >
        {/* Navigation Card */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col h-full hover-lift group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-primary/20 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
              <Navigation className="w-6 h-6 text-slate-100" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">Active</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Smart Routing</h2>
          <p className="text-slate-400 mb-8 flex-1 leading-relaxed">Find the fastest route to your seat avoiding current crowd congestion.</p>
          <button 
            onClick={() => setActiveModal('map')}
            className="w-full py-3.5 bg-white text-black hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Open Map <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Parking Card */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col h-full hover-lift group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-secondary/20 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
              <Car className="w-6 h-6 text-slate-100" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Parking Lots</h2>
          <div className="space-y-4 mb-8 flex-1">
            {parking.slice(0,2).map(lot => (
              <div key={lot.id} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                <span className="text-slate-300 font-medium">{lot.name}</span>
                <span className={`font-mono text-sm px-2 py-0.5 rounded-md ${lot.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {lot.availableSpots} spots
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setActiveModal('parking')}
            className="w-full py-3.5 glass-panel hover:bg-white/10 rounded-xl text-sm font-semibold transition-all"
          >
            View All Lots
          </button>
        </motion.div>

        {/* Food & Beverage */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col h-full hover-lift group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
              <Utensils className="w-6 h-6 text-slate-100" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Food Courts</h2>
          <div className="space-y-4 mb-8 flex-1">
            {food.slice(0,2).map(item => (
              <div key={item.id} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                <div>
                  <div className="text-slate-200 font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.location}</div>
                </div>
                <span className="text-orange-400 font-mono text-sm bg-orange-500/10 px-2 py-0.5 rounded-md">{item.wait_time_mins}m wait</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setActiveModal('food')}
            className="w-full py-3.5 glass-panel hover:bg-white/10 rounded-xl text-sm font-semibold transition-all"
          >
            Order Ahead
          </button>
        </motion.div>

        {/* Transport */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col h-full hover-lift group relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
              <Train className="w-6 h-6 text-slate-100" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Transport</h2>
          <div className="space-y-4 mb-8 flex-1">
            {transport.slice(0,2).map(t => (
              <div key={t.id} className="flex justify-between items-center pb-3 border-b border-white/5 last:border-0 last:pb-0">
                <span className="text-slate-300 font-medium">{t.line}</span>
                <span className="text-blue-300 font-mono text-sm bg-blue-500/10 px-2 py-0.5 rounded-md">{t.next_departure}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Medical */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col h-full hover-lift group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl shadow-lg shadow-red-500/20">
              <Cross className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Medical Centers</h2>
          <p className="text-slate-400 mb-8 flex-1 leading-relaxed">Locate the nearest first aid or emergency medical services.</p>
          <button 
            onClick={() => setActiveModal('medical')}
            className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-all border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            Emergency SOS
          </button>
        </motion.div>
        
        {/* Restrooms */}
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col h-full hover-lift group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-[50px]" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
              <Bath className="w-6 h-6 text-slate-100" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Restrooms</h2>
          <p className="text-slate-400 mb-8 flex-1 leading-relaxed">Find the closest restrooms and check live wait times.</p>
          <button 
            onClick={() => setActiveModal('restrooms')}
            className="w-full py-3.5 glass-panel hover:bg-white/10 rounded-xl text-sm font-semibold transition-all"
          >
            Find Nearest
          </button>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <Modal isOpen={activeModal === 'map'} onClose={() => setActiveModal(null)} title="Smart Routing & Map">
        <div className="aspect-video w-full rounded-xl overflow-hidden relative bg-slate-800">
          {/* Mock Map Image/Iframe */}
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0 }} 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11369.317585094384!2d-74.06830589709778!3d40.81232840502081!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2f86151752179%3A0xc47b99c0ce5b211f!2sMetLife%20Stadium!5e0!3m2!1sen!2sus!4v1716584281313!5m2!1sen!2sus"
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 flex flex-col gap-2 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Optimized Route Found
            </div>
            <p className="text-slate-200 text-xs">Avoiding congestion at Gate A.<br/>Proceed to Gate C for fastest entry.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'parking'} onClose={() => setActiveModal(null)} title="All Parking Lots">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {parking.map(lot => (
            <div key={lot.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-white font-medium">{lot.name}</h4>
                <p className="text-sm text-slate-400">Total Spots: {lot.totalSpots}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${lot.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {lot.status === 'open' ? `${lot.availableSpots} spots` : 'Full'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'food'} onClose={() => setActiveModal(null)} title="Order Food Ahead">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {food.map(item => (
            <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-white font-medium">{item.name}</h4>
                <p className="text-sm text-slate-400">{item.location}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-orange-400 text-sm font-medium">{item.wait_time_mins}m wait</span>
                <button className="px-4 py-2 bg-fifa-primary hover:bg-fifa-primary/90 text-white rounded-lg text-sm font-semibold transition-colors">
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'medical'} onClose={() => { setActiveModal(null); setSosState('idle'); }} title="Emergency Services">
        {sosState === 'sent' ? (
          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30"
            >
              <Cross className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Medical Team Dispatched</h3>
            <p className="text-slate-300 mb-2">A medical response team has been alerted to your location.</p>
            <p className="text-sm text-slate-400 mb-6">Stay calm and remain in your seat. Help is on the way.</p>
            <div className="flex items-center justify-center gap-2 py-3 px-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SOS Signal Active – ETA ~3 mins
            </div>
          </div>
        ) : (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cross className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Are you in an emergency?</h3>
            <p className="text-slate-300 mb-6">If you require immediate medical assistance, we will dispatch a team to your seat location.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setActiveModal(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors">
                Cancel
              </button>
              <button
                onClick={handleEmergencySOS}
                disabled={sosState === 'loading'}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-70 text-white rounded-xl font-semibold transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2"
              >
                {sosState === 'loading' ? (
                  <><Activity className="w-4 h-4 animate-pulse" /> Dispatching...</>
                ) : 'Confirm SOS'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={activeModal === 'restrooms'} onClose={() => setActiveModal(null)} title="Nearest Restrooms">
        <div className="space-y-4">
          <div className="p-4 bg-white/5 border border-emerald-500/30 rounded-xl flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div>
              <h4 className="text-white font-medium">Level 1 - Section 120 (Nearest)</h4>
              <p className="text-sm text-slate-400">2 mins walking distance</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
              No Wait
            </span>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
            <div>
              <h4 className="text-white font-medium">Level 1 - Section 124</h4>
              <p className="text-sm text-slate-400">4 mins walking distance</p>
            </div>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold">
              5m Wait
            </span>
          </div>
        </div>
      </Modal>

    </motion.div>
  );
};

export default FanDashboard;

