import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, Shield, Briefcase, Accessibility } from 'lucide-react';
import { motion } from 'framer-motion';
import { SiriOrb } from '../components/SiriOrb';
import { NeuroNoise } from '@paper-design/shaders-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/assistant', icon: MessageSquare, label: 'Assistant' },
  { path: '/fan', icon: User, label: 'Dashboard' },
  { path: '/organizer', icon: Shield, label: 'Organizer' },
  { path: '/volunteer', icon: Briefcase, label: 'Volunteer' },
  { path: '/accessibility', icon: Accessibility, label: 'Accessibility' },
] as const;

const Layout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">

      {/* Skip to main content — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-fifa-primary focus:text-black focus:font-bold focus:rounded-xl focus:shadow-xl"
      >
        Skip to main content
      </a>

      {/* Animated Shader Background */}
      <div className="fixed inset-0 -z-10 w-full h-full opacity-80 pointer-events-none" aria-hidden="true">
        <NeuroNoise
          colorFront="#120e2e"
          colorMid="#030712"
          colorBack="#0a122c"
          scale={1.0}
          speed={0.15}
          width="100%"
          height="100%"
        />
      </div>

      {/* Decorative ambient background glows */}
      <div aria-hidden="true" className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fifa-primary/20 rounded-full blur-[150px] pointer-events-none -z-10 animate-[pulse_8s_ease-in-out_infinite]" />
      <div aria-hidden="true" className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fifa-secondary/15 rounded-full blur-[150px] pointer-events-none -z-10 animate-[pulse_10s_ease-in-out_infinite_reverse]" />

      {/* Floating Top Navigation (Desktop) */}
      <div className="hidden md:block sticky top-6 z-50 px-6 max-w-5xl mx-auto w-full">
        <nav
          className="liquid-glass-nav rounded-full px-5 py-3.5 flex items-center justify-between shadow-2xl transition-all duration-300"
          aria-label="Main navigation"
        >
          <Link to="/" className="flex items-center gap-3 pl-2 group" aria-label="FanFlow home">
            <SiriOrb size="38px" animationDuration={8} />
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 group-hover:from-fifa-primary group-hover:to-fifa-accent transition-all duration-500">
              FanFlow
            </span>
          </Link>

          <div className="flex space-x-1.5 bg-white/[0.02] p-1 rounded-full border border-white/[0.04]" role="list">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  role="listitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifa-primary
                    ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill-desktop"
                      className="absolute inset-0 bg-gradient-to-r from-fifa-primary/20 to-fifa-secondary/20 rounded-full border border-fifa-primary/30 shadow-[0_0_15px_rgba(0,200,255,0.15)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-fifa-primary' : 'text-slate-400 group-hover:text-slate-200'}`} aria-hidden="true" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full relative z-0 pb-20 md:pb-8 pt-8 md:pt-16">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-6 inset-x-4 z-50">
        <nav
          className="liquid-glass-nav rounded-full px-3 py-2 flex justify-around items-center shadow-2xl"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fifa-primary
                  ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill-mobile"
                    className="absolute inset-0 bg-gradient-to-tr from-fifa-primary/10 to-fifa-secondary/15 rounded-full border border-fifa-primary/20 shadow-[0_0_10px_rgba(0,200,255,0.1)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 mb-0.5 ${isActive ? 'text-fifa-primary drop-shadow-[0_0_8px_rgba(0,200,255,0.5)]' : ''}`} aria-hidden="true" />
                <span className="text-[9px] font-semibold relative z-10 tracking-wide" aria-hidden="true">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;

