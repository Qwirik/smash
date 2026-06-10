import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  hoverEffect?: boolean;
  key?: string | number;
}

export function Card({ children, className = '', onClick, hoverEffect = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel p-6 rounded-brand border-brand flex flex-col gap-4 text-brand-panel-text relative transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        hoverEffect
          ? 'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--app-primary)]/10 hover:border-[var(--app-primary)]/45'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
