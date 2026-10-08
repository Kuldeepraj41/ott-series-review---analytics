import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, WatchlistItem, UserRating } from '../types';
import { API_CONFIG, authApi, clearAuthTokens, userApi } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCritic: boolean;
  isLoading: boolean;
  authModal: 'login' | 'register' | null;
  openAuthModal: (mode: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, password?: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestCriticVerification: (outlet: string) => Promise<void>;
  toggleWatchlist: (seriesId: string) => Promise<void>;
  updateWatchlistStatus: (seriesId: string, status: 'watching' | 'plan_to_watch' | 'completed') => Promise<void>;
  rateSeries: (seriesId: string, rating: number) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isInWatchlist: (seriesId: string) => boolean;
  getUserRating: (seriesId: string) => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    // Check if user session is saved as active
    const savedSession = localStorage.getItem('cinepulse_auth_session');
    if (savedSession === 'active') {
      userApi.getProfile()
        .then((profile) => setUser(profile))
        .catch(() => {
          clearAuthTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Default to unauthenticated so visitor sees the About / Pre-Login dashboard
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModal(mode);
  };

  const closeAuthModal = () => {
    setAuthModal(null);
  };

  const login = async (email: string, _password?: string, _remember = true) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    try {
      if (API_CONFIG.backendMode === 'django') {
        const profile = await authApi.login(email, _password || '', _remember);
        setUser(profile);
      } else {
        const profile = await userApi.getProfile();
        setUser({ ...profile, email });
        localStorage.setItem('cinepulse_auth_session', 'active');
      }
      setAuthModal(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed.' };
    }
  };

  const register = async (name: string, email: string, _password?: string) => {
    if (!name.trim()) return { success: false, error: 'Name cannot be empty.' };
    if (!email.includes('@')) return { success: false, error: 'Valid email is required.' };

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      bio: 'OTT series enthusiast and community reviewer.',
      role: 'Community Reviewer',
      isCertifiedCritic: false,
      verificationStatus: 'none',
      isAdmin: false,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      preferredPlatforms: ['Netflix', 'HBO Max'],
      watchlist: [],
      ratings: [],
    };

    try {
      if (API_CONFIG.backendMode === 'django') {
        setUser(await authApi.register(name, email, _password || ''));
      } else {
        await userApi.updateProfile(newUser);
        setUser(newUser);
        localStorage.setItem('cinepulse_auth_session', 'active');
      }
      setAuthModal(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed.' };
    }
  };

  const logout = () => {
    setUser(null);
    if (API_CONFIG.backendMode === 'django') clearAuthTokens();
    else localStorage.setItem('cinepulse_auth_session', 'logged_out');
  };

  const requestCriticVerification = async (outlet: string) => {
    if (!user) return;
    const updated = await userApi.updateProfile({
      verificationStatus: 'pending',
      criticOutlet: outlet,
    });
    setUser(updated);
  };

  const toggleWatchlist = async (seriesId: string) => {
    const updated = await userApi.toggleWatchlist(seriesId);
    setUser(updated);
  };

  const updateWatchlistStatus = async (
    seriesId: string,
    status: 'watching' | 'plan_to_watch' | 'completed'
  ) => {
    const updated = await userApi.updateWatchlistStatus(seriesId, status);
    setUser(updated);
  };

  const rateSeries = async (seriesId: string, rating: number) => {
    const updated = await userApi.rateSeries(seriesId, rating);
    setUser(updated);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await userApi.updateProfile(updates);
    setUser(updated);
  };

  const isInWatchlist = (seriesId: string): boolean => {
    return user?.watchlist.some((w) => w.seriesId === seriesId) || false;
  };

  const getUserRating = (seriesId: string): number | null => {
    const found = user?.ratings.find((r) => r.seriesId === seriesId);
    return found ? found.rating : null;
  };

  const isCritic =
    user?.isCertifiedCritic === true ||
    user?.role?.toLowerCase().includes('critic') ||
    user?.role?.toLowerCase().includes('lead') ||
    user?.role?.toLowerCase().includes('scientist') ||
    false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin === true || user?.role?.includes('Admin') || false,
        isCritic,
        isLoading,
        authModal,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        requestCriticVerification,
        toggleWatchlist,
        updateWatchlistStatus,
        rateSeries,
        updateProfile,
        isInWatchlist,
        getUserRating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
