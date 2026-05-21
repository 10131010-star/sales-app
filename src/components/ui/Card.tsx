import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: string;
}

export function Card({ children, className = '', onClick, accent }: CardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ${onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : ''} ${className}`}
      style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}
    >
      {children}
    </Tag>
  );
}
