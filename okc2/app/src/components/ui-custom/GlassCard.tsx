import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'green' | 'burgundy';
  intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  intensity = 'medium' 
}: GlassCardProps) {
  const variantStyles = {
    default: 'bg-white/5 border-white/10',
    dark: 'bg-black/30 border-white/5',
    green: 'bg-emerald-900/20 border-emerald-500/20',
    burgundy: 'bg-rose-900/20 border-rose-500/20'
  };

  const intensityStyles = {
    low: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    high: 'backdrop-blur-xl'
  };

  return (
    <div
      className={cn(
        'rounded-2xl border',
        variantStyles[variant],
        intensityStyles[intensity],
        className
      )}
    >
      {children}
    </div>
  );
}
