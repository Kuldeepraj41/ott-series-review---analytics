import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  Search,
  Moon,
  Sun,
  Bookmark,
  User,
  LogOut,
  Sliders,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated, isAdmin, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-700 to-rose-500 shadow-md shadow-rose-900/30 text-white font-bold transition-transform group-hover:scale-105">
              <Film className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                OTTIntel
                <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/30">
                  PRO
                </span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium -mt-1">
                OTT Analytics & Reviews
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex items-center flex-1 max-w-md mx-6"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search series, directors, genres, platforms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg bg-slate-900/90 border border-slate-800 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
            />
          </div>
        </form>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Admin Portal Shortcut if Admin */}
          {isAdmin ? (
            <Link
              to="/admin"
              title="Open Admin Management Console"
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">Admin Console</span>
            </Link>
          ) : null}

          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Watchlist shortcut */}
          {isAuthenticated ? (
            <Link
              to="/profile?tab=watchlist"
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="My Watchlist"
            >
              <Bookmark className="h-4 w-4" />
              {user?.watchlist?.length ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                  {user.watchlist.length}
                </span>
              ) : null}
            </Link>
          ) : null}

          {/* User profile dropdown or Login button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover border border-rose-500/50"
                />
                <span className="hidden md:inline text-xs font-semibold text-slate-200">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl z-40">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[10px] text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      My Profile & Reviews
                    </Link>

                    <Link
                      to="/profile?tab=watchlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                    >
                      <Bookmark className="h-3.5 w-3.5 text-slate-400" />
                      Watchlist ({user.watchlist.length})
                    </Link>

                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
                        Admin Console
                      </Link>
                    ) : null}

                    <div className="my-1 border-t border-slate-800" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal('login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAuthModal('register')}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
