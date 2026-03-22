import { cn } from '@/lib/utils';

interface GradientBlobProps {
  className?: string;
  colors?: string[];
  animate?: boolean;
}

export function GradientBlob({ 
  className, 
  colors = ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
  animate = true 
}: GradientBlobProps) {
  return (
    <div 
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        className
      )}
    >
      <div 
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[150%] h-[150%] rounded-full',
          animate && 'animate-gradient-shift'
        )}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, ${colors[0]}40 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, ${colors[1]}40 0%, transparent 50%),
            radial-gradient(circle at 30% 70%, ${colors[2]}40 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, ${colors[3]}40 0%, transparent 50%)
          `,
          filter: 'blur(60px)'
        }}
      />
    </div>
  );
}
