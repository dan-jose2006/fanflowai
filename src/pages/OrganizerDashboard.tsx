import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, AlertTriangle, TrendingUp, Sparkles, FileText, Check, Loader2, Zap } from 'lucide-react';
import { API_BASE } from '../config/api';

// Static fallback crowd data — used when backend is unreachable
const STATIC_CROWD_LEVELS = [
  { id: 'zone-1', name: 'North Entrance', density: 85, status: 'high', trend: 'increasing' },
  { id: 'zone-2', name: 'South Plaza', density: 45, status: 'normal', trend: 'stable' },
  { id: 'zone-3', name: 'Food Court A', density: 92, status: 'critical', trend: 'increasing' },
  { id: 'zone-4', name: 'East Concourse', density: 30, status: 'low', trend: 'decreasing' },
  { id: 'zone-5', name: 'Fan Zone VIP', density: 65, status: 'normal', trend: 'stable' },
];

const OrganizerDashboard = () => {
  const [chartData, setChartData] = useState<any[]>(STATIC_CROWD_LEVELS.map(d => ({ name: d.name, density: d.density })));
  const [telemetry, setTelemetry] = useState<any>({ crowd_levels: STATIC_CROWD_LEVELS, active_insights: [] });
  const [summary, setSummary] = useState<{text: string, recommendations: string[], loading: boolean} | null>(null);
  const [simulatorStatus, setSimulatorStatus] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'3d' | 'heatmap' | 'chart'>('3d');
  const [selectedZone, setSelectedZone] = useState<any>(null);

  // Announcement state
  const [annCategory, setAnnCategory] = useState('crowd congestion');
  const [annLocation, setAnnLocation] = useState('North Entrance');
  const [annSeverity, setAnnSeverity] = useState('warning');
  const [annLanguage, setAnnLanguage] = useState('en');
  const [annContext, setAnnContext] = useState('');
  const [annResult, setAnnResult] = useState<{text: string, urgency: string, channels: string[]} | null>(null);
  const [annLoading, setAnnLoading] = useState(false);
  const [annCopied, setAnnCopied] = useState(false);

  const generateAnnouncement = async () => {
    setAnnLoading(true);
    setAnnResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/dashboard/announcement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_type: `${annCategory} at ${annLocation} (${annSeverity} severity). Context: ${annContext}`,
          language: annLanguage
        })
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      
      const urgency = annSeverity === 'critical' ? 'CRITICAL' : annSeverity === 'warning' ? 'HIGH' : 'MEDIUM';
      const channels = annSeverity === 'critical' 
        ? ['Stadium PA Audio', 'VIP Lounge Displays', 'Mobile Push Notifications', 'Volunteer Radio Channel 1'] 
        : ['Stadium PA Audio', 'Mobile Push Notifications'];

      setAnnResult({
        text: data.announcement_text,
        urgency,
        channels
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAnnLoading(false);
    }
  };

  const getTimelineEvents = () => {
    const events: any[] = [];
    
    telemetry.crowd_levels?.forEach((c: any) => {
      if (c.density >= 90) {
        events.push({
          time: '14:32',
          type: 'Crowd Capacity Alert',
          location: c.name,
          severity: 'Critical',
          action: 'Rerouting flow & deploying emergency volunteers',
          status: 'Active'
        });
      } else if (c.density >= 75) {
        events.push({
          time: '14:15',
          type: 'Crowd Surge Warning',
          location: c.name,
          severity: 'High',
          action: 'Opening overflow lanes',
          status: 'Active'
        });
      }
    });

    telemetry.transport_status?.forEach((t: any) => {
      if (t.status === 'Delayed' || t.status === 'delayed') {
        events.push({
          time: '14:10',
          type: 'Transit Delay',
          location: t.line || t.route,
          severity: 'Medium',
          action: 'Announcing alternative transport options',
          status: 'Active'
        });
      }
    });

    telemetry.medical_requests?.forEach((m: any) => {
      events.push({
        time: '14:05',
        type: 'Medical Emergency',
        location: m.location,
        severity: m.status === 'urgent' ? 'Critical' : 'Medium',
        action: m.description || 'First Aid dispatched',
        status: 'Dispatched'
      });
    });

    telemetry.incident_summary?.forEach((i: any) => {
      events.push({
        time: '13:55',
        type: String(i.incident_type).toUpperCase(),
        location: i.location,
        severity: i.severity || 'Medium',
        action: i.recommended_action || 'Staff alerted',
        status: 'Action Taken'
      });
    });

    return events;
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/dashboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTelemetry(data);
      if (data.crowd_levels?.length) {
        setChartData(data.crowd_levels.map((d: any) => ({ name: d.name, density: d.density })));
      }
    } catch (error) {
      // Backend unreachable — silently keep static fallback data already in state
      console.warn('Dashboard API unavailable, using static fallback:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async (type: string, location: string, severity: string) => {
    try {
      setSimulatorStatus('triggering');
      await fetch(`${API_BASE}/api/v1/simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: type, location, severity })
      });
      setSimulatorStatus('success');
      setTimeout(() => setSimulatorStatus(null), 2000);
      fetchDashboard();
    } catch (e) {
      console.error(e);
      setSimulatorStatus(null);
    }
  };

  const generateSummary = async () => {
    try {
      setSummary({ text: '', recommendations: [], loading: true });
      const res = await fetch(`${API_BASE}/api/v1/dashboard/summary`, { method: 'POST' });
      const data = await res.json();
      setSummary({ text: data.summary, recommendations: data.recommendations || [], loading: false });
    } catch (e) {
      console.error(e);
      setSummary(null);
    }
  };

  const timelineData = [
    { time: '12:00', total: 12000 },
    { time: '13:00', total: 25000 },
    { time: '14:00', total: 45000 },
    { time: '15:00', total: 68000 },
    { time: '16:00', total: 72000 },
    { time: '17:00', total: 75000 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-6"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fifa-secondary to-fifa-primary">Organizer</span> Center
          </h1>
          <p className="text-slate-400">Live telemetry and predictive crowd insights.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={generateSummary}
            className="px-5 py-2.5 glass-panel text-slate-300 hover:text-white border border-white/10 rounded-xl flex items-center gap-2 hover-lift transition-all"
          >
            {summary?.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span className="font-semibold text-sm">Match Summary</span>
          </button>
          
          <div className="group relative">
            <button className="px-5 py-2.5 bg-fifa-primary/20 text-fifa-primary hover:bg-fifa-primary/30 border border-fifa-primary/30 rounded-xl flex items-center gap-2 transition-all hover-lift">
              <Zap className="w-4 h-4" />
              <span className="font-semibold text-sm">Event Simulator</span>
            </button>
            
            {/* Simulator Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-64 glass-card p-2 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 translate-y-2 group-hover:translate-y-0">
              <div className="text-xs font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">Trigger Events</div>
              <button onClick={() => triggerSimulation('heavy_crowd', 'North Entrance', 'critical')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-slate-200 transition-colors">
                🌊 Heavy Crowd (North Entrance)
              </button>
              <button onClick={() => triggerSimulation('heavy_crowd', 'Food Court A', 'critical')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-slate-200 transition-colors">
                🍔 Crowd Surge (Food Court A)
              </button>
              <button onClick={() => triggerSimulation('transport_delay', 'Route 42', 'warning')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-slate-200 transition-colors">
                🚌 Bus Delay (Route 42)
              </button>
              <button onClick={() => triggerSimulation('medical_emergency', 'Section 120', 'urgent')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-slate-200 transition-colors">
                🚑 Medical SOS (Section 120)
              </button>
              <button onClick={() => triggerSimulation('weather_warning', 'stadium', 'Heavy Rain')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-slate-200 transition-colors">
                ⛈️ Heavy Rain Warning
              </button>
              {simulatorStatus === 'success' && (
                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 justify-center font-bold">
                  <Check className="w-3.5 h-3.5" /> Simulation Injected
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Summary Banner */}
      <AnimatePresence>
        {summary && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-[24px] overflow-hidden border border-fifa-secondary/30 bg-fifa-secondary/5"
          >
            <div className="p-6 md:p-8 relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-fifa-secondary/10 rounded-full blur-[80px]" />
               <h2 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10 text-fifa-secondary">
                 <Sparkles className="w-5 h-5" /> Executive AI Summary
               </h2>
               <div className="relative z-10 text-slate-200 leading-relaxed text-[15px]">
                  {summary.loading ? (
                    <div className="flex items-center gap-3 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-fifa-secondary" />
                      Analyzing massive telemetry datasets...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="font-semibold text-white text-[16px]">{summary.text}</p>
                      {summary.recommendations && summary.recommendations.length > 0 && (
                        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
                          {summary.recommendations.map((rec, index) => (
                            <li key={index} className="leading-relaxed">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Attendance", value: "75,234", icon: Users, color: "text-fifa-primary", bg: "bg-fifa-primary/10", border: "border-fifa-primary/20" },
          { title: "Active Incidents", value: "14", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
          { title: "Avg Wait Time", value: "12m", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
          { title: "AI Optimizations", value: "8", icon: Sparkles, color: "text-fifa-secondary", bg: "bg-fifa-secondary/10", border: "border-fifa-secondary/20" }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass-card p-5 rounded-[20px] flex items-center gap-5 hover-lift"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight mb-0.5">{stat.value}</div>
              <div className="text-sm text-slate-400 font-medium">{stat.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart / Heatmap panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 hybrid-neo-glass p-6 md:p-8 rounded-[24px] flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white">Live Stadium Operations</h2>
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setViewMode('3d')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === '3d' ? 'bg-fifa-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                3D Stadium View
              </button>
              <button 
                onClick={() => setViewMode('heatmap')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'heatmap' ? 'bg-fifa-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Density Heatmap
              </button>
              <button 
                onClick={() => setViewMode('chart')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'chart' ? 'bg-fifa-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Analytics Chart
              </button>
            </div>
          </div>

          {viewMode === '3d' || viewMode === 'heatmap' ? (
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center py-4">
                {viewMode === '3d' ? (
                  <div className="relative w-full max-w-[500px] aspect-[16/9] md:aspect-video rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950">
                    <iframe
                      title="Football Stadium 3D Model"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      src="https://sketchfab.com/models/9c64652cb715419e836d030033ad5c17/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_help=0&ui_settings=0&ui_inspector=0&ui_annotations=0&ui_stop=0&camera=0"
                      className="w-full h-full"
                      style={{ filter: 'saturate(0.4) contrast(1.2) brightness(0.9)' }}
                    />
                    {/* Thermal color overlay for live heatmap rendering */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 opacity-75 mix-blend-color" 
                      style={{
                        background: `
                          radial-gradient(circle at 47% 22%, rgba(239, 68, 68, 0.95) 0%, rgba(249, 115, 22, 0.6) 20%, rgba(234, 179, 8, 0.3) 40%, transparent 65%),
                          radial-gradient(circle at 23% 55%, rgba(239, 68, 68, 0.95) 0%, rgba(249, 115, 22, 0.6) 20%, rgba(234, 179, 8, 0.3) 40%, transparent 65%),
                          radial-gradient(circle at 35% 72%, rgba(16, 185, 129, 0.6) 0%, rgba(59, 130, 246, 0.3) 30%, transparent 55%),
                          radial-gradient(circle at 70% 40%, rgba(16, 185, 129, 0.5) 0%, rgba(59, 130, 246, 0.2) 30%, transparent 55%),
                          radial-gradient(circle at 45% 45%, rgba(249, 115, 22, 0.75) 0%, rgba(234, 179, 8, 0.4) 25%, transparent 50%),
                          linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.15) 100%)
                        `
                      }}
                    />
                    {/* Live indicator badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live 3D View</span>
                    </div>

                    {/* Overlay pulsing hot nodes on the 3D model */}
                    {telemetry?.crowd_levels?.map((zone: any) => {
                      let coords = { top: '50%', left: '50%', origin: 'center center' };
                      switch (zone.name) {
                        case 'North Entrance': coords = { top: '22%', left: '47%', origin: '47% 22%' }; break;
                        case 'South Plaza': coords = { top: '72%', left: '35%', origin: '35% 72%' }; break;
                        case 'Food Court A': coords = { top: '55%', left: '23%', origin: '23% 55%' }; break;
                        case 'East Concourse': coords = { top: '40%', left: '70%', origin: '70% 40%' }; break;
                        case 'Fan Zone VIP': coords = { top: '45%', left: '45%', origin: '45% 45%' }; break;
                      }

                      const isCritical = zone.density >= 90;
                      const isHigh = zone.density >= 75 && zone.density < 90;
                      
                      let glowColor = "bg-emerald-500 shadow-[0_0_15px_#10b981]";
                      let pulseColor = "border-emerald-500 bg-emerald-500/20";
                      if (isCritical) {
                        glowColor = "bg-red-500 shadow-[0_0_15px_#ef4444]";
                        pulseColor = "border-red-500 bg-red-500/20";
                      } else if (isHigh) {
                        glowColor = "bg-orange-500 shadow-[0_0_15px_#f97316]";
                        pulseColor = "border-orange-500 bg-orange-500/20";
                      }

                      return (
                        <div 
                          key={zone.id}
                          className="absolute group/node cursor-pointer -translate-x-1/2 -translate-y-1/2 z-10"
                          style={{ top: coords.top, left: coords.left }}
                          onClick={() => setSelectedZone({ ...zone, origin: coords.origin })}
                        >
                          {/* Pulse Ring */}
                          <span className={`absolute inline-flex h-8 w-8 rounded-full border animate-ping opacity-75 ${pulseColor}`} />
                          {/* Inner Dot */}
                          <span className={`relative inline-flex rounded-full h-4 w-4 border border-white/20 ${glowColor}`} />
                          
                          {/* Hover Tooltip */}
                          {(!selectedZone || selectedZone.id === zone.id) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 rounded-lg bg-slate-950/90 border border-white/10 text-center opacity-0 pointer-events-none group-hover/node:opacity-100 transition-opacity z-50 backdrop-blur-md shadow-xl">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">{zone.name}</div>
                              <div className={`text-xs font-black mt-0.5 ${isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-emerald-400'}`}>
                                Density: {zone.density}%
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Stadium Heatmap Image Container with Interactive Hotspots */
                  <div className="relative w-full max-w-[500px] aspect-[16/9] md:aspect-video rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950">
                    <motion.div 
                      className="w-full h-full relative"
                      animate={{
                        scale: selectedZone ? 2.5 : 1,
                        transformOrigin: selectedZone ? selectedZone.origin : "center center"
                      }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    >
                      <img 
                        src="/stadium-heatmap.png" 
                        alt="Live Stadium Heatmap" 
                        className="w-full h-full object-cover opacity-90"
                      />
                      
                      {/* Overlay pulsing hot nodes */}
                      {telemetry?.crowd_levels?.map((zone: any) => {
                        let coords = { top: '50%', left: '50%', origin: 'center center' };
                        switch (zone.name) {
                          case 'North Entrance': coords = { top: '22%', left: '47%', origin: '47% 22%' }; break;
                          case 'South Plaza': coords = { top: '72%', left: '35%', origin: '35% 72%' }; break;
                          case 'Food Court A': coords = { top: '55%', left: '23%', origin: '23% 55%' }; break;
                          case 'East Concourse': coords = { top: '40%', left: '70%', origin: '70% 40%' }; break;
                          case 'Fan Zone VIP': coords = { top: '45%', left: '45%', origin: '45% 45%' }; break;
                        }

                        const isCritical = zone.density >= 90;
                        const isHigh = zone.density >= 75 && zone.density < 90;
                        
                        let glowColor = "bg-emerald-500 shadow-[0_0_15px_#10b981]";
                        let pulseColor = "border-emerald-500 bg-emerald-500/20";
                        if (isCritical) {
                          glowColor = "bg-red-500 shadow-[0_0_15px_#ef4444]";
                          pulseColor = "border-red-500 bg-red-500/20";
                        } else if (isHigh) {
                          glowColor = "bg-orange-500 shadow-[0_0_15px_#f97316]";
                          pulseColor = "border-orange-500 bg-orange-500/20";
                        }

                        return (
                          <div 
                            key={zone.id}
                            className="absolute group/node cursor-pointer -translate-x-1/2 -translate-y-1/2"
                            style={{ top: coords.top, left: coords.left }}
                            onClick={() => setSelectedZone({ ...zone, origin: coords.origin })}
                          >
                            {/* Pulse Ring */}
                            <span className={`absolute inline-flex h-8 w-8 rounded-full border animate-ping opacity-75 ${pulseColor}`} />
                            {/* Inner Dot */}
                            <span className={`relative inline-flex rounded-full h-4 w-4 border border-white/20 ${glowColor}`} />
                            
                            {/* Hover Tooltip */}
                            {(!selectedZone || selectedZone.id === zone.id) && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 rounded-lg bg-slate-950/90 border border-white/10 text-center opacity-0 pointer-events-none group-hover/node:opacity-100 transition-opacity z-50 backdrop-blur-md shadow-xl">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{zone.name}</div>
                                <div className={`text-xs font-black mt-0.5 ${isCritical ? 'text-red-400' : isHigh ? 'text-orange-400' : 'text-emerald-400'}`}>
                                  Density: {zone.density}%
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>

                    {/* Reset Zoom Button inside the Map Frame */}
                    {selectedZone && (
                      <button 
                        onClick={() => setSelectedZone(null)}
                        className="absolute top-4 left-4 bg-slate-950/80 border border-white/10 hover:bg-white/10 text-white font-bold text-xs px-3 py-1.5 rounded-lg backdrop-blur-md transition-colors z-40"
                      >
                        ← Zoom Out
                      </button>
                    )}
                  </div>
                )}

                {/* Side Legend/Data summary or Detail Panel */}
                <div className="flex-1 w-full space-y-3.5 min-h-[250px] flex flex-col justify-between">
                  {selectedZone ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Detailed View</span>
                        <h3 className="text-xl font-bold text-white tracking-tight">{selectedZone.name}</h3>
                      </div>

                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Telemetry Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            selectedZone.density >= 90 ? 'bg-red-500/20 text-red-400' :
                            selectedZone.density >= 75 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>{selectedZone.status || 'Nominal'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Live Density Metric:</span>
                          <span className="text-sm font-bold font-mono text-white">{selectedZone.density}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Flow Trend:</span>
                          <span className="text-sm font-bold text-white capitalize">{selectedZone.trend}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-fifa-primary/10 border border-fifa-primary/20 rounded-xl space-y-2">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1">
                          <h4 className="text-xs font-bold text-fifa-primary uppercase tracking-wider">AI Recommendation</h4>
                          <span className="text-[9px] bg-fifa-secondary/20 text-fifa-secondary px-1.5 py-0.5 rounded font-bold">
                            CONFIDENCE: {selectedZone.density >= 90 ? '98%' : selectedZone.density >= 75 ? '92%' : '88%'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedZone.density >= 90 
                            ? `Critical congestion at ${selectedZone.name}. Rerouting all incoming fan traffic to secondary gates and deploying standby volunteer scanners.`
                            : selectedZone.density >= 75
                            ? `Increasing arrival flow. Recommend opening standby queue lanes to stabilize wait times.`
                            : `Flow rates are optimal. Continue monitoring standard gates.`}
                        </p>
                        <div className="text-[10px] text-slate-400 space-y-1 pt-1.5 border-t border-white/5">
                          <div><span className="font-semibold text-slate-300">Decision Factors:</span> Density ({selectedZone.density}%), Trend ({selectedZone.trend})</div>
                          <div><span className="font-semibold text-slate-300">Suggested Action:</span> {selectedZone.density >= 75 ? 'Open Overflow Gates' : 'Maintain Standard Operations'}</div>
                          <div><span className="font-semibold text-slate-300">Alternative:</span> Reroute to adjacent sections</div>
                          <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-400 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                            Data Source: Simulated Telemetry
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedZone(null)}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Return to Overview
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Zone Live Density Status</div>
                        <p className="text-xs text-slate-500 mb-3">Click on a zone node on the map to zoom in and view detailed analytics.</p>
                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {telemetry?.crowd_levels?.map((zone: any) => (
                            <div 
                              key={zone.id} 
                              onClick={() => {
                                let origin = 'center center';
                                switch (zone.name) {
                                  case 'North Entrance': origin = '47% 22%'; break;
                                  case 'South Plaza': origin = '35% 72%'; break;
                                  case 'Food Court A': origin = '23% 55%'; break;
                                  case 'East Concourse': origin = '70% 40%'; break;
                                  case 'Fan Zone VIP': origin = '45% 45%'; break;
                                }
                                setSelectedZone({ ...zone, origin });
                              }}
                              className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  zone.density >= 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                  zone.density >= 75 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                  'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                }`} />
                                <span className="text-sm font-semibold text-slate-200">{zone.name}</span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-slate-400 text-xs">{zone.trend === 'increasing' ? '↗' : zone.trend === 'decreasing' ? '↘' : '→'}</span>
                                <span className={`text-sm font-bold ${
                                  zone.density >= 90 ? 'text-red-400' :
                                  zone.density >= 75 ? 'text-orange-400' :
                                  'text-emerald-400'
                                }`}>{zone.density}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
            </div>
          ) : (
            <div className="h-80 w-full p-2 bg-slate-950/20 rounded-2xl border border-white/[0.03] backdrop-blur-sm relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 8 }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 15, 30, 0.75)', 
                      border: '1px solid rgba(0, 240, 255, 0.25)', 
                      borderRadius: '16px', 
                      backdropFilter: 'blur(20px) saturate(180%)', 
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)' 
                    }}
                    itemStyle={{ color: '#00f0ff', fontWeight: 600 }}
                    labelStyle={{ color: '#fff', opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Bar dataKey="density" fill="url(#colorDensity)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
 
        {/* AI Recommendations Panel */}
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 }}
           className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-fifa-secondary/10 rounded-full blur-[60px]" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10 tracking-tight">
            <Sparkles className="w-5 h-5 text-fifa-secondary" />
            Live AI Insights
          </h2>
          <div className="space-y-4 flex-1 relative z-10 overflow-y-auto max-h-[400px] hide-scrollbar">
            {telemetry?.active_insights?.length > 0 ? (
              telemetry.active_insights.map((insight: any, idx: number) => (
                <div key={idx} className={`p-5 border rounded-[16px] hover:bg-white/5 transition-colors ${
                  insight.type === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                  insight.type === 'warning' ? 'bg-orange-500/5 border-orange-500/20' :
                  'bg-fifa-secondary/5 border-fifa-secondary/20'
                }`}>
                  <div className={`text-sm font-bold mb-2 tracking-wide uppercase ${
                    insight.type === 'critical' ? 'text-red-400' :
                    insight.type === 'warning' ? 'text-orange-400' :
                    'text-fifa-secondary'
                  }`}>
                    {insight.type} Alert
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{insight.message}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400 italic">Scanning telemetry for insights...</div>
            )}
          </div>
        </motion.div>
 
        {/* Arrival Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 glass-card p-6 md:p-8 rounded-[24px]"
        >
          <h2 className="text-xl font-bold mb-6 tracking-tight">Arrival Timeline</h2>
          <div className="h-64 w-full p-2 bg-slate-950/20 rounded-2xl border border-white/[0.03] backdrop-blur-sm relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.35}/>
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 15, 30, 0.75)', 
                    border: '1px solid rgba(0, 240, 255, 0.25)', 
                    borderRadius: '16px', 
                    backdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)' 
                  }}
                  itemStyle={{ color: '#00f0ff', fontWeight: 600 }}
                  labelStyle={{ color: '#fff', opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Area type="monotone" dataKey="total" stroke="url(#colorStroke)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                <defs>
                  <linearGradient id="colorStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Public Announcement Generator & Match Day Operational Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in"
        >
          {/* Announcement Card */}
          <div className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between relative overflow-hidden border border-white/5 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-primary/10 rounded-full blur-[40px]" />
            <h3 className="text-xl font-bold mb-6 tracking-tight text-white flex items-center gap-2 relative z-10">
              <Zap className="w-5 h-5 text-fifa-primary" /> Public Announcement Generator
            </h3>
            
            <div className="space-y-4 relative z-10 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ann-cat" className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
                  <select 
                    id="ann-cat"
                    value={annCategory} 
                    onChange={(e) => setAnnCategory(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-fifa-primary"
                  >
                    <option value="crowd congestion">Crowd Congestion</option>
                    <option value="gate closure">Gate Closure</option>
                    <option value="weather alert">Weather Alert</option>
                    <option value="transport delay">Transport Delay</option>
                    <option value="medical assistance">Medical Assistance</option>
                    <option value="lost child">Lost Child</option>
                    <option value="emergency evacuation">Emergency Evacuation</option>
                    <option value="accessibility notice">Accessibility Notice</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ann-lang" className="block text-xs font-semibold text-slate-400 mb-1.5">Language</label>
                  <select 
                    id="ann-lang"
                    value={annLanguage} 
                    onChange={(e) => setAnnLanguage(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-fifa-primary"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ann-loc" className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                  <input 
                    id="ann-loc"
                    type="text" 
                    value={annLocation} 
                    onChange={(e) => setAnnLocation(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-fifa-primary"
                  />
                </div>
                <div>
                  <label htmlFor="ann-sev" className="block text-xs font-semibold text-slate-400 mb-1.5">Severity</label>
                  <select 
                    id="ann-sev"
                    value={annSeverity} 
                    onChange={(e) => setAnnSeverity(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-fifa-primary"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ann-ctx" className="block text-xs font-semibold text-slate-400 mb-1.5">Extra Context (Optional)</label>
                <input 
                  id="ann-ctx"
                  type="text" 
                  value={annContext} 
                  placeholder="e.g. Reroute via Gate C" 
                  onChange={(e) => setAnnContext(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-fifa-primary"
                />
              </div>

              <button 
                onClick={generateAnnouncement}
                disabled={annLoading}
                className="w-full py-2.5 bg-fifa-primary text-black font-extrabold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {annLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Zap className="w-4.5 h-4.5" />}
                Generate PA Broadcast
              </button>

              {annResult && (
                <div className="p-4 bg-slate-900/80 border border-white/10 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
                      {annResult.urgency} Urgency
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(annResult.text);
                        setAnnCopied(true);
                        setTimeout(() => setAnnCopied(false), 2000);
                      }}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      {annCopied ? 'Copied!' : 'Copy Text'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">"{annResult.text}"</p>
                  <div className="border-t border-white/5 pt-2">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Recommended Delivery Channels:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {annResult.channels.map((ch: string, i: number) => (
                        <span key={i} className="text-[9px] font-semibold bg-white/5 border border-white/5 text-slate-300 px-2 py-0.5 rounded-full">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between relative overflow-hidden border border-white/5 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-secondary/10 rounded-full blur-[40px]" />
            <h3 className="text-xl font-bold mb-6 tracking-tight text-white flex items-center gap-2 relative z-10">
              <FileText className="w-5 h-5 text-fifa-secondary" /> Match Day Operational Timeline
            </h3>

            <div className="space-y-3.5 flex-1 relative z-10 overflow-y-auto max-h-[340px] pr-2 custom-scrollbar">
              {getTimelineEvents().length > 0 ? (
                getTimelineEvents().map((evt: any, i: number) => (
                  <div key={i} className="flex gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="text-xs font-mono font-bold text-fifa-secondary pt-0.5">{evt.time}</div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200">{evt.type}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          evt.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          evt.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {evt.severity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Location:</span> {evt.location}
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-400">Action:</span> {evt.action}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {evt.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-12">All systems nominal. No incidents reported in timeline.</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Accessibility screen-reader fallback table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-3 glass-card p-6 md:p-8 rounded-[24px] border border-white/5 shadow-xl"
        >
          <h3 className="text-lg font-bold mb-4 tracking-tight text-white">Stadium Zone Density Status & Sustainability Guide</h3>
          <p className="text-xs text-slate-400 mb-4">This screen-reader friendly table lists live crowd densities and sustainability recommendations for each stadium zone.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-slate-400">
                  <th className="pb-3 pr-4">Zone Name</th>
                  <th className="pb-3 px-4">Density</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Trend</th>
                  <th className="pb-3 pl-4">Eco-Friendly Guidance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {telemetry?.crowd_levels?.map((zone: any) => {
                  let ecoAdvice = "Refill reusable water bottles at hydration units near gate. Recycle cup at bins.";
                  if (zone.name === 'North Entrance') ecoAdvice = "Highly congested. Reroute via Gate C (East Concourse) using green bus lines.";
                  if (zone.name === 'South Plaza') ecoAdvice = "Low traffic. Accessible restrooms and EV transit shuttles available here.";
                  return (
                    <tr key={zone.id}>
                      <td className="py-3.5 pr-4 font-semibold text-white">{zone.name}</td>
                      <td className={`py-3.5 px-4 font-mono font-bold ${
                        zone.density >= 90 ? 'text-red-400' : zone.density >= 75 ? 'text-orange-400' : 'text-emerald-400'
                      }`}>{zone.density}%</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          zone.density >= 90 ? 'bg-red-500/10 text-red-400' : zone.density >= 75 ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>{zone.status}</span>
                      </td>
                      <td className="py-3.5 px-4 capitalize">{zone.trend}</td>
                      <td className="py-3.5 pl-4 text-slate-400 italic">{ecoAdvice}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OrganizerDashboard;
