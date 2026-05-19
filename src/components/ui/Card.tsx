import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: string;
}

export function Card({ children, className = '', onClick, accent }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition active:scale-[0.98] ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
      style={accent ? { borderTopWidth: 4, borderTopColor: accent } : undefined}
    >
      {children}
    </div>
  );
}
