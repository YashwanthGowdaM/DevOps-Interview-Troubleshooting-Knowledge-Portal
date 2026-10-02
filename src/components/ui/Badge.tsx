import React from 'react';
import { PriorityLevel, ExperienceLevel } from '../../lib/types';

interface BadgeProps {
  type?: 'questionType' | 'priority' | 'experience' | 'cloud' | 'tech' | 'generic';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type = 'generic', value, className = '' }) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border border-slate-200';

  if (type === 'questionType') {
    if (value === 'Interview Question') {
      styleClasses = 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold';
    } else if (value === 'Troubleshooting Question') {
      styleClasses = 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold';
    }
  } else if (type === 'priority') {
    switch (value as PriorityLevel) {
      case 'Critical':
        styleClasses = 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
        break;
      case 'High':
        styleClasses = 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold';
        break;
      case 'Medium':
        styleClasses = 'bg-sky-50 text-sky-700 border border-sky-200';
        break;
      case 'Low':
        styleClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        break;
    }
  } else if (type === 'experience') {
    switch (value as ExperienceLevel) {
      case 'Lead / Principal':
        styleClasses = 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold';
        break;
      case 'Senior':
        styleClasses = 'bg-blue-50 text-blue-700 border border-blue-200';
        break;
      case 'Mid-Level':
        styleClasses = 'bg-cyan-50 text-cyan-800 border border-cyan-200';
        break;
      case 'Junior':
        styleClasses = 'bg-teal-50 text-teal-800 border border-teal-200';
        break;
    }
  } else if (type === 'cloud') {
    styleClasses = 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md whitespace-nowrap tracking-wide ${styleClasses} ${className}`}
    >
      {value}
    </span>
  );
};
