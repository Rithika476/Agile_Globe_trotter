import React from 'react';
import { ActivityCategory } from '../../types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | ActivityCategory;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-teal-50 text-teal-700 border-teal-200',

    // Activity category badges
    sightseeing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activities: 'bg-teal-50 text-teal-700 border-teal-200',
    food: 'bg-amber-50 text-amber-800 border-amber-200',
    accommodation: 'bg-sky-50 text-sky-700 border-sky-200',
    transport: 'bg-purple-50 text-purple-700 border-purple-200',
    shopping: 'bg-pink-50 text-pink-700 border-pink-200',
    other: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {children}
    </span>
  );
};
