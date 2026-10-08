import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';

const AboutLandingPage = lazy(() => import('./pages/AboutLandingPage').then(({ AboutLandingPage }) => ({ default: AboutLandingPage })));
const HomePage = lazy(() => import('./pages/HomePage').then(({ HomePage }) => ({ default: HomePage })));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage').then(({ SeriesDetailPage }) => ({ default: SeriesDetailPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(({ AnalyticsPage }) => ({ default: AnalyticsPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(({ ComparePage }) => ({ default: ComparePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(({ ProfilePage }) => ({ default: ProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(({ AdminPage }) => ({ default: AdminPage })));

function AppContent() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If user directly browses to /login or /register, trigger the blurred auth modal
  useEffect(() => {
    if (location.pathname === '/login') {
      openAuthModal('login');
    } else if (location.pathname === '/register') {
      openAuthModal('register');
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Top Navigation */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      {/* Main Application Body */}
      <div className="flex flex-1 relative">
        {/* Sidebar Navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Page Content Container */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div role="status" className="p-8 text-sm text-slate-400">Loading page...</div>}>
          <Routes>
            {/* If unauthenticated: Home shows About / Pre-Login Dashboard.
                If authenticated: Home shows Full Series Review & Catalog Dashboard */}
            <Route
              path="/"
              element={isAuthenticated ? <HomePage /> : <AboutLandingPage />}
            />
            {/* Explicit About / Platform information route */}
            <Route path="/about" element={<AboutLandingPage />} />
            {/* If authenticated user wants to view catalog directly */}
            <Route path="/catalog" element={<HomePage />} />

            <Route path="/series/:id" element={<SeriesDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />

            {/* Direct /login and /register routes display page with blurred auth modal */}
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <AboutLandingPage />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/" replace /> : <AboutLandingPage />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </main>
      </div>

      {/* Footer with Platform Credits and Specs */}
      <Footer />

      {/* Auth Modal with slightly blurred background backdrop */}
      <AuthModal />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
