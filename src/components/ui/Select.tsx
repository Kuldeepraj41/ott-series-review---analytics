import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './Button';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, icon, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        ) : null}
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 pr-8 text-sm text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:border-rose-500/70 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            icon && 'pl-9',
            error && 'border-rose-500 focus-visible:ring-rose-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  }
);
Select.displayName = 'Select';
