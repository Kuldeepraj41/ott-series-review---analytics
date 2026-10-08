import React, { useState, useEffect } from 'react';
import { X, Film, Mail, Lock, User, ArrowRight, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const AuthModal: React.FC = () => {
  const { authModal, closeAuthModal, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password sub-view
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (authModal) {
      setMode(authModal);
      setError('');
      setIsForgotView(false);
      setForgotSuccess(false);
    }
  }, [authModal]);

  if (!authModal) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await login(email, password, rememberMe);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept community review terms.');
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    setForgotSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Slightly blurred backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-all duration-300"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 p-6 sm:p-8 text-slate-100 shadow-2xl backdrop-blur-md z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-700 to-rose-500 text-white shadow-lg shadow-rose-900/40 mb-1">
            <Film className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {isForgotView
              ? 'Reset Critic Password'
              : mode === 'login'
              ? 'Sign In to OTTIntel'
              : 'Create Critic Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {isForgotView
              ? 'Enter your registered email to receive access credentials.'
              : mode === 'login'
              ? 'Access real-time OTT sentiment analytics & post reviews.'
              : 'Join the community of verified streaming critics.'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Hidden during forgot password view) */}
        {!isForgotView ? (
          <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Forgot Password Sub-flow */}
        {isForgotView ? (
          forgotSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="h-10 w-10 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xs text-slate-300">
                A password reset token has been dispatched to{' '}
                <span className="font-mono text-emerald-400">{forgotEmail}</span>.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setIsForgotView(false);
                  setForgotSuccess(false);
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="critic@example.com"
                    className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 pl-9 pr-3 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotView(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm">
                  Send Recovery Link
                </Button>
              </div>
            </form>
          )
        ) : mode === 'login' ? (
          /* Sign In Form */
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700/80 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotView(true);
                    setError('');
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700/80 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="modal-remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 accent-rose-600 cursor-pointer"
              />
              <label htmlFor="modal-remember" className="text-xs text-slate-400 cursor-pointer">
                Remember my session
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>

          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maya Patel"
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 pl-9 pr-3 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="critic@example.com"
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 pl-9 pr-3 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6+ chars"
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter"
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 px-3 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="modal-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 accent-rose-600 cursor-pointer"
              />
              <label htmlFor="modal-terms" className="text-[11px] text-slate-400 cursor-pointer">
                I agree to verified critic standards and community guidelines.
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Complete Registration
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
