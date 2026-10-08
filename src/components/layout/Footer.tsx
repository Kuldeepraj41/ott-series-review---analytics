import React from 'react';
import { Film } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 py-8 px-4 sm:px-6 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
            <Film className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-200">OTTIntel OTT Review & Analytics</p>
            <p className="text-[11px] text-slate-500">
              Enterprise Streaming Intelligence · Full-Stack REST Architecture
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span>Sentiment NLP Engine</span>
          <span>·</span>
          <span>Recharts Visualizer</span>
          <span>·</span>
          <span>Tailwind CSS</span>
        </div>

        <div className="text-[11px] text-slate-500 text-center md:text-right">
          <p>© 2026 OTTIntel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
