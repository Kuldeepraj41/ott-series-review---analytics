import React from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon ? (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          ) : null}
          <input
            type={type}
            ref={ref}
            className={cn(
              'flex h-9 w-full rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:border-rose-500/70 disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-9',
              error && 'border-rose-500 focus-visible:ring-rose-500',
              className
            )}
            {...props}
          />
        </div>
        {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
