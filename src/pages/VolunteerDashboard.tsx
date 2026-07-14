import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, AlertCircle, BellRing, MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { API_BASE } from '../config/api';

interface Toast {
  type: 'success' | 'error';
  message: string;
}

interface AiIncidentResult {
  incident_summary: string;
  severity: string;
  priority: string;
  recommended_action: string;
}

const VolunteerDashboard = () => {
  const [incidentType, setIncidentType] = useState('general');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [aiResponse, setAiResponse] = useState<AiIncidentResult | null>(null);

  const activeTasks = [
    { id: 1, title: 'Assist disabled fan at Gate 4', location: 'Gate 4, North', time: '10 min ago', priority: 'High' },
    { id: 2, title: 'Crowd control support', location: 'Food Court A', time: '25 min ago', priority: 'Medium' },
    { id: 3, title: 'Restock printed guides', location: 'Info Desk 2', time: '1 hr ago', priority: 'Low' }
  ];

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setAiResponse(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_type: incidentType, location, description }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: AiIncidentResult = await res.json();
      setAiResponse(data);
      showToast('success', `Report submitted — Severity: ${data.severity}`);
      setLocation('');
      setDescription('');
      setIncidentType('general');
    } catch {
      showToast('error', 'Failed to submit report. Check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 space-y-8"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-2xl border text-sm font-semibold
              ${toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/80 border-red-500/30 text-red-300'}`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 shrink-0" />
              : <XCircle className="w-5 h-5 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Volunteer Hub</h1>
        <p className="text-slate-400 text-lg">Manage tasks, reports, and real-time alerts.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Active Tasks */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
            <ClipboardList className="w-6 h-6 text-fifa-primary" />
            Active Assignments
          </h2>
          <div className="space-y-4">
            {activeTasks.map((task, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={task.id}
                className="glass-card p-6 md:p-8 rounded-[24px] border-l-4 relative overflow-hidden hover-lift group"
                style={{ borderLeftColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f97316' : '#10b981' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] group-hover:bg-white/10 transition-colors" />
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <h3 className="font-bold text-xl pr-12 text-slate-100">{task.title}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider
                    ${task.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 font-medium relative z-10">
                  <MapPin className="w-4 h-4" />
                  {task.location} <span className="opacity-50">•</span> {task.time}
                </div>
                <div className="flex gap-3 relative z-10">
                  <button className="flex-1 bg-white text-black hover:bg-slate-200 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl">
                    Accept Task
                  </button>
                  <button className="flex-1 glass-panel hover:bg-white/10 text-white py-3 rounded-xl text-sm font-bold transition-all border border-white/10">
                    Mark Done
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Incident Form & Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 md:p-8 rounded-[24px]"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 tracking-tight">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Report Incident
            </h2>
            <form className="space-y-5" onSubmit={handleSubmitIncident}>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Incident Type</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-[15px] focus:outline-none focus:border-fifa-primary/50 focus:ring-1 focus:ring-fifa-primary/50 transition-all text-white shadow-inner"
                >
                  <option value="general" className="bg-slate-900">General</option>
                  <option value="medical" className="bg-slate-900">Medical Emergency</option>
                  <option value="security" className="bg-slate-900">Security Threat</option>
                  <option value="maintenance" className="bg-slate-900">Maintenance</option>
                  <option value="crowd" className="bg-slate-900">Crowd Control</option>
                  <option value="fire" className="bg-slate-900">Fire / Safety</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Location <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-[15px] focus:outline-none focus:border-fifa-primary/50 focus:ring-1 focus:ring-fifa-primary/50 transition-all text-white placeholder-slate-600 shadow-inner"
                  placeholder="e.g. Section 110, Gate 4"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-[15px] focus:outline-none focus:border-fifa-primary/50 focus:ring-1 focus:ring-fifa-primary/50 transition-all text-white placeholder-slate-600 min-h-[120px] shadow-inner resize-none"
                  placeholder="Describe the situation..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
                  : 'Submit Report'}
              </button>
            </form>

            {/* AI Analysis Response */}
            <AnimatePresence>
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    AI Analysis Complete
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border
                      ${aiResponse.severity?.toLowerCase() === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        aiResponse.severity?.toLowerCase() === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                      Severity: {aiResponse.severity}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Priority: {aiResponse.priority}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{aiResponse.incident_summary}</p>
                  <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Recommended Action</p>
                    <p className="text-slate-200 text-sm">{aiResponse.recommended_action}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 md:p-8 rounded-[24px] border border-fifa-primary/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-primary/10 rounded-full blur-[40px]" />
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 tracking-tight relative z-10">
              <BellRing className="w-5 h-5 text-fifa-primary" />
              HQ Broadcasts
            </h2>
            <div className="space-y-3 relative z-10">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-sm hover:bg-white/10 transition-colors">
                <div className="font-bold text-fifa-secondary mb-1">14:30</div>
                <div className="text-slate-300 leading-relaxed">Shift change in 30 minutes. Please report to HQ for briefing.</div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-sm hover:bg-white/10 transition-colors">
                <div className="font-bold text-fifa-secondary mb-1">13:15</div>
                <div className="text-slate-300 leading-relaxed">Water stations at East Wing refilled. Guide fans there.</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default VolunteerDashboard;
