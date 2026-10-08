import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Server, CheckCircle2, Copy, Check, Code2, Database, ShieldCheck } from 'lucide-react';
import { API_CONFIG } from '../../services/api';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [backendMode, setBackendMode] = useState<'mock' | 'django'>(API_CONFIG.backendMode);
  const [djangoUrl, setDjangoUrl] = useState(API_CONFIG.djangoUrl);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveConfig = () => {
    API_CONFIG.setBackendMode(backendMode);
    API_CONFIG.setDjangoUrl(djangoUrl);
    setTestResult(`Configuration saved. Reload to use ${backendMode === 'mock' ? 'Mock JSON / LocalStorage' : djangoUrl}`);
    setTimeout(() => setTestResult(null), 3500);
  };

  const copyEndpoints = () => {
    const text = `
Django REST Framework Endpoints:
GET  /api/v1/series/             # List all OTT series with search, platform & genre filters
GET  /api/v1/series/{id}/        # Retrieve series details with sentiment distribution
GET  /api/v1/series/trending/    # Trending OTT series
GET  /api/v1/reviews/series/{id}/# List reviews for series with sentiment filter & sorting
POST /api/v1/reviews/            # Add new review & analyze sentiment
POST /api/v1/reviews/{id}/vote/  # Helpful vote increment/decrement
GET  /api/v1/analytics/overview/ # Aggregated metrics: sentiment %, ratings, platforms
POST /api/v1/auth/login/         # JWT or Token authentication
POST /api/v1/auth/register/      # User registration
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backend Architecture & Django REST Integration"
      description="Integration Spec: Abstracted API Service Layer ready for Django REST Framework."
      maxWidth="xl"
    >
      <div className="space-y-5 text-xs text-slate-300">
        {/* Architecture Status Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-800/40 bg-emerald-950/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-200">
              Clean API Abstraction Layer Active
            </h4>
            <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
              All series cards, rating breakdowns, user reviews, and analytical charts query
              via <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono">src/services/api.ts</code>.
              Switch between local mock data and the implemented Django REST API here without changing page components.
            </p>
          </div>
        </div>

        {/* Backend Configuration Selector */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <label className="text-xs font-bold text-white block">Active API Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBackendMode('mock')}
              className={`p-3 rounded-lg border text-left transition-all ${
                backendMode === 'mock'
                  ? 'border-rose-500 bg-rose-950/20 text-white font-medium'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-rose-400" />
                <span className="font-semibold text-xs">Mock JSON (Local Client)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Zero setup required. Persists to browser storage with realistic async delays.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setBackendMode('django')}
              className={`p-3 rounded-lg border text-left transition-all ${
                backendMode === 'django'
                  ? 'border-emerald-500 bg-emerald-950/20 text-white font-medium'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-xs">Django REST Backend</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Connects directly to your local or hosted Django / Postgres server.
              </p>
            </button>
          </div>

          {backendMode === 'django' ? (
            <div className="mt-3 space-y-1">
              <label className="text-[11px] text-slate-400">Django Base API URL</label>
              <input
                type="text"
                value={djangoUrl}
                onChange={(e) => setDjangoUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000/api/v1"
                className="w-full h-8 px-3 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-white"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Button size="sm" variant="secondary" onClick={handleSaveConfig}>
              Save Configuration
            </Button>
            {testResult ? (
              <span className="text-[11px] text-emerald-400 font-medium">{testResult}</span>
            ) : null}
          </div>
        </div>

        {/* Django Serializer & Endpoints Blueprint */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-rose-400" />
              Django REST Endpoints Spec
            </span>
            <button
              onClick={copyEndpoints}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy Spec'}
            </button>
          </div>
          <pre className="text-[10px] font-mono text-slate-400 bg-slate-900/90 p-3 rounded-lg overflow-x-auto border border-slate-800/80 leading-relaxed">
{`# Implemented Django REST endpoints
urlpatterns = [
  path('api/v1/series/', SeriesListView.as_view()),
  path('api/v1/reviews/', ReviewListCreateView.as_view()),
  path('api/v1/reviews/series/<slug:series_id>/', ReviewListCreateView.as_view()),
  path('api/v1/analytics/overview/', analytics_overview),
  path('api/v1/auth/login/', LoginView.as_view()),
  path('api/v1/auth/register/', RegisterView.as_view()),
]`}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
