import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  badge?: string;
  badgeVariant?: 'blue' | 'sky' | 'emerald' | 'amber' | 'slate';
  title?: string;
  subtitle?: string;
  centered?: boolean;
  background?: 'white' | 'light' | 'navy' | 'blue-tint';
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  id,
  badge,
  badgeVariant = 'blue',
  title,
  subtitle,
  centered = true,
  background = 'white',
  children,
  className = '',
  ...props
}) => {
  const bgStyles = {
    white: 'bg-white',
    light: 'bg-slate-50',
    'blue-tint': 'bg-blue-50/50',
    navy: 'bg-slate-900 text-white'
  };

  const badgeStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <section
      id={id}
      className={`py-16 md:py-24 ${bgStyles[background]} ${className}`}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(badge || title || subtitle) && (
          <div className={`mb-12 md:mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}`}>
            {badge && (
              <span
                className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border mb-3 ${badgeStyles[badgeVariant]}`}
              >
                {badge}
              </span>
            )}
            {title && (
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${
                background === 'navy' ? 'text-white' : 'text-slate-900'
              }`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`mt-3 text-base sm:text-lg leading-relaxed ${
                background === 'navy' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
};
