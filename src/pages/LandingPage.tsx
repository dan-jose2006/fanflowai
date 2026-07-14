import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Map, Shield, Activity, Clock, Globe, Zap, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import TextType from '../components/TextType';
import { AnimatedCounter } from '../components/AnimatedCounter';

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-24 text-center overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 opacity-60 mix-blend-screen"
          >
            <source src="/hero-stadium.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-fifa-bg/80 via-fifa-bg/60 to-fifa-bg" />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-6xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="mb-8 relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-fifa-primary to-fifa-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel border border-white/20 text-slate-200 text-sm font-medium shadow-2xl">
              <Sparkles className="w-4 h-4 text-fifa-secondary" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 font-semibold tracking-wide uppercase">Official 2026 Companion</span>
            </div>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[1.05] max-w-4xl min-h-[140px] md:min-h-[200px] lg:min-h-[220px] flex flex-col items-center">
            <span>The intelligent way to</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fifa-primary via-slate-100 to-fifa-secondary mt-2">
              <TextType 
                as="span"
                text={["experience the game.", "navigate the crowds.", "track live analytics.", "find your seat.", "enjoy the World Cup."]}
                typingSpeed={70}
                deletingSpeed={40}
                pauseDuration={2500}
                loop={true}
              />
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            FanFlow AI is your ultimate intelligent companion for the 2026 FIFA World Cup. From smart routing to real-time stadium telemetry.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            <Link to="/assistant" className="w-full sm:w-auto px-10 py-5 rounded-full bg-fifa-primary text-white font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
              Launch AI Assistant <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/fan" className="w-full sm:w-auto px-10 py-5 rounded-full glass-panel hover:bg-white/[0.08] text-white font-bold transition-all flex items-center justify-center gap-2 text-lg hover-lift border border-white/10">
              Explore Dashboard
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
        >
          <span className="text-xs uppercase tracking-widest font-semibold">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      </section>

      {/* 2. Scale / Statistics Section */}
      <section className="py-20 relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { icon: Globe, value: 3, suffix: "", label: "Host Nations" },
              { icon: Map, value: 16, suffix: "", label: "Host Cities" },
              { icon: Users, value: 5, suffix: "M+", label: "Expected Fans" },
              { icon: Trophy, value: 1, suffix: "", label: "Intelligent Platform" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center justify-center"
              >
                <stat.icon className="w-8 h-8 text-fifa-secondary mb-4 opacity-70" />
                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm md:text-base text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. About Section */}
      <section className="py-32 relative z-10 px-4 sm:px-6 overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full bg-fifa-primary/5 blur-[100px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fifa-primary/10 text-fifa-primary border border-fifa-primary/20 text-sm font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4" /> The Vision
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Redefining the <br/> Match Day Experience.
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                For the largest FIFA World Cup in history, spanning across North America, logistical complexity is unprecedented. FanFlow AI serves as the central nervous system for the tournament.
              </p>
              <p className="text-lg text-slate-400 leading-relaxed">
                By harnessing real-time telemetry, predictive analytics, and conversational AI, we ensure that every fan, organizer, and volunteer operates in perfect harmony.
              </p>
              
              <ul className="space-y-4 pt-4">
                {['Seamless Stadium Entry', 'Predictive Crowd Control', 'Hyper-personalized Assistance'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              style={{ y }}
              className="relative"
            >
              <div className="aspect-square md:aspect-[4/3] rounded-[2rem] bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 shadow-2xl overflow-hidden relative">
                {/* Abstract Data Visualization Mockup inside the box */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-[120%] h-[120%] rounded-full border-[1px] border-fifa-primary/30 absolute animate-[spin_20s_linear_infinite]" />
                  <div className="w-[90%] h-[90%] rounded-full border-[1px] border-fifa-secondary/30 absolute animate-[spin_15s_linear_infinite_reverse]" />
                  <div className="w-[60%] h-[60%] rounded-full border-[2px] border-emerald-500/30 absolute animate-[spin_10s_linear_infinite]" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 glass-panel p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">Live Operations</span>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">Nominal</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-fifa-primary to-fifa-secondary rounded-full relative">
                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-[4px] animate-[pulse_1s_infinite]" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Bento Grid Features Section */}
      <section className="py-24 px-4 sm:px-6 relative z-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features.</h2>
          <p className="text-xl text-slate-400">Everything you need, packed into one seamless platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
          {/* Feature 1 - Large */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="md:col-span-2 glass-card rounded-[2rem] p-10 hover-lift group relative overflow-hidden flex flex-col justify-end border border-white/5"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-fifa-primary/20 rounded-full blur-[80px] group-hover:bg-fifa-primary/30 transition-colors duration-700" />
            <div className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl">
              <Map className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-3 text-white tracking-tight">Dynamic Smart Routing</h3>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">Our AI analyzes thousands of data points to find you the fastest path to your seat, proactively avoiding bottlenecks and crowding.</p>
            </div>
          </motion.div>

          {/* Feature 2 - Small */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[2rem] p-8 hover-lift group relative overflow-hidden flex flex-col justify-between border border-white/5"
          >
            <div className="w-14 h-14 rounded-2xl bg-fifa-secondary/10 border border-fifa-secondary/20 flex items-center justify-center text-fifa-secondary mb-6 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Crowd Safety</h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">Real-time density heatmaps to keep you and your family safe.</p>
            </div>
          </motion.div>

          {/* Feature 3 - Small */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[2rem] p-8 hover-lift group relative overflow-hidden flex flex-col justify-between border border-white/5"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-inner">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">Live Wait Times</h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">Never miss a goal. Know exactly how long the restroom or food line is.</p>
            </div>
          </motion.div>

          {/* Feature 4 - Large */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 glass-card rounded-[2rem] p-10 hover-lift group relative overflow-hidden flex flex-col justify-end border border-white/5"
          >
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/15 rounded-full blur-[80px] group-hover:bg-purple-500/25 transition-colors duration-700" />
            <div className="absolute top-10 left-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-2xl">
              <Activity className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <div className="relative z-10 md:ml-auto md:text-right">
              <h3 className="text-3xl font-bold mb-3 text-white tracking-tight">Organizer Telemetry</h3>
              <p className="text-slate-400 text-lg max-w-md ml-auto leading-relaxed">Command center views for stadium operators with predictive AI for incident prevention and traffic optimization.</p>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* 5. Footer */}
      <footer className="mt-auto pt-20 pb-10 text-center relative z-10 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 text-left">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-fifa-primary to-fifa-secondary flex items-center justify-center font-bold text-white shadow-lg">
                  F
                </div>
                <span className="font-bold text-2xl tracking-tight text-white">
                  FanFlow AI
                </span>
              </div>
              <p className="text-slate-400 max-w-sm">The intelligent operating system for the FIFA World Cup 2026.</p>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-slate-300">
              <Link to="/assistant" className="hover:text-white transition-colors">AI Assistant</Link>
              <Link to="/fan" className="hover:text-white transition-colors">Fan Dashboard</Link>
              <Link to="/organizer" className="hover:text-white transition-colors">Organizers</Link>
              <Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
            </div>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
          <p className="font-medium tracking-wide text-slate-500 text-sm">&copy; 2026 FanFlow AI. Built for the FIFA World Cup 2026. Frontend Demo.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
