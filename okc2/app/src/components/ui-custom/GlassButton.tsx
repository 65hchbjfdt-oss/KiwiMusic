import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function GlassButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  fullWidth = false,
  ...props 
}: GlassButtonProps) {
  const variantStyles = {
    default: 'bg-white/10 hover:bg-white/20 border-white/20 text-white',
    primary: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-transparent',
    secondary: 'bg-rose-900/30 hover:bg-rose-900/50 border-rose-500/30 text-white',
    ghost: 'bg-transparent hover:bg-white/5 border-transparent text-white/70 hover:text-white',
    glass: 'bg-white/5 hover:bg-white/10 border-white/10 text-white backdrop-blur-md'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        'rounded-xl border font-medium transition-all duration-200',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
