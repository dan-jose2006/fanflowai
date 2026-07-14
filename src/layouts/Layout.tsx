import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, Shield, Briefcase, Accessibility } from 'lucide-react';
import { motion } from 'framer-motion';
import { SiriOrb } from '../components/SiriOrb';
import { NeuroNoise } from "@paper-design/shaders-react";

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/assistant', icon: MessageSquare, label: 'Assistant' },
    { path: '/fan', icon: User, label: 'Dashboard' },
    { path: '/organizer', icon: Shield, label: 'Organizer' },
    { path: '/volunteer', icon: Briefcase, label: 'Volunteer' },
    { path: '/accessibility', icon: Accessibility, label: 'Accessibility' },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      
      {/* Animated Shader Background */}
      <div className="fixed inset-0 -z-10 w-full h-full opacity-80 pointer-events-none">
        <NeuroNoise 
          colorFront="#120e2e" // Very dark purple
          colorMid="#030712"   // Deepest navy/black
          colorBack="#0a122c"  // Very dark blue
          scale={1.0}
          speed={0.15}         // Slow, organic movement
          width="100%"
          height="100%"
        />
      </div>

      {/* Decorative ambient background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fifa-primary/20 rounded-full blur-[150px] pointer-events-none -z-10 animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fifa-secondary/15 rounded-full blur-[150px] pointer-events-none -z-10 animate-[pulse_10s_ease-in-out_infinite_reverse]" />

      {/* Floating Top Navigation (Desktop) */}
      <div className="hidden md:block sticky top-6 z-50 px-6 max-w-5xl mx-auto w-full">
        <nav className="glass-panel rounded-full px-4 py-3 flex items-center justify-between border border-white/10 shadow-2xl shadow-black/50">
          <Link to="/" className="flex items-center gap-3 pl-2 group">
            <SiriOrb size="36px" animationDuration={8} />
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              FanFlow
            </span>
          </Link>
          
          <div className="flex space-x-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2
                    ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill-desktop"
                      className="absolute inset-0 bg-white/[0.1] rounded-full border border-white/[0.1] shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-0 pb-20 md:pb-8 pt-8 md:pt-16">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-6 inset-x-4 z-50">
        <nav className="glass-panel rounded-full px-2 py-2 flex justify-around items-center shadow-2xl shadow-black/80 border border-white/10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full
                  ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill-mobile"
                    className="absolute inset-0 bg-white/[0.1] rounded-full border border-white/[0.05]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 mb-1 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                <span className="text-[9px] font-medium relative z-10 tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
