import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Film,
  BarChart3,
  GitCompare,
  User,
  Tv,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  TrendingUp,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, openAuthModal } = useAuth();

  const navItems = [
    { label: 'Browse Series', icon: Film, path: '/' },
    { label: 'Analytics Dashboard', icon: BarChart3, path: '/analytics' },
    { label: 'Compare Series', icon: GitCompare, path: '/compare' },
    { label: 'Critic Profile', icon: User, path: '/profile' },
    ...(isAdmin ? [{ label: 'Admin Console', icon: ShieldCheck, path: '/admin' }] : []),
    { label: 'About OTTIntel', icon: Sparkles, path: '/about' },
  ];

  const quickPlatforms = [
    { name: 'Netflix', query: '?platform=Netflix', color: 'bg-red-500' },
    { name: 'HBO Max', query: '?platform=HBO+Max', color: 'bg-purple-500' },
    { name: 'Apple TV+', query: '?platform=Apple+TV%2B', color: 'bg-sky-400' },
    { name: 'Prime Video', query: '?platform=Prime+Video', color: 'bg-blue-400' },
    { name: 'Hulu', query: '?platform=Hulu', color: 'bg-emerald-400' },
    { name: 'Disney+', query: '?platform=Disney%2B', color: 'bg-indigo-400' },
  ];

  return (
    <>
      {/* Mobile backdrop positioned below header */}
      {isOpen ? (
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:self-start md:translate-x-0 shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Main Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Core Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-rose-600/15 text-rose-300 border border-rose-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-rose-400' : 'text-slate-400'
                      )}
                    />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Platforms filter shortcut */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Streaming Platforms</span>
              <Tv className="h-3 w-3" />
            </div>
            <div className="space-y-0.5">
              {quickPlatforms.map((plat) => (
                <NavLink
                  key={plat.name}
                  to={`/${plat.query}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-3 py-2 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-1.5 w-1.5 rounded-full', plat.color)} />
                    <span>{plat.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">OTT</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Enterprise Platform Architecture Card */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-slate-200 font-semibold">
              <BookOpen className="h-3.5 w-3.5 text-rose-400" />
              <span>Production Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              OTT Series Review, Sentiment Analysis & Comparative Metrics Engine.
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Stack: React + TS + Tailwind</span>
              <span className="font-mono text-emerald-400">v1.2</span>
            </div>
          </div>

          {/* Sign In Prompt if unauthenticated */}
          {!isAuthenticated ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 space-y-2">
              <p className="text-xs font-bold text-white">Critic Sign In</p>
              <p className="text-[11px] text-slate-400">
                Sign in to post reviews, cast votes, and customize watchlists.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal('login');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Service Mesh Active</span>
          </div>
          <span className="font-mono text-[10px] text-slate-600">PRO-2026</span>
        </div>
      </aside>
    </>
  );
};
