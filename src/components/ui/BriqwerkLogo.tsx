import { cn } from '@/lib/utils';

interface BriqwerkLogoProps {
  size?: number;
  variant?: 'default' | 'light' | 'dark';
  className?: string;
  showClaim?: boolean;
  animate?: boolean;
}

export function BriqwerkLogo({ 
  size = 64, 
  variant = 'default',
  className,
  showClaim = false,
  animate = false
}: BriqwerkLogoProps) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-2',
      className
    )}>
      <img
        src="/logo.svg"
        alt="BriqWerk Core Logo"
        width={size}
        height={size}
        className={cn(
          'object-contain',
          variant === 'light' && 'brightness-[1.2]',
          variant === 'dark' && '[filter:brightness(0.8)_saturate(1.2)]',
          animate && 'hover:scale-105 transition-transform duration-300',
          'select-none'
        )}
        draggable={false}
      />
      {showClaim && (
        <span className={cn(
          'text-xs italic tracking-wide text-center',
          variant === 'light' && 'text-gray-100',
          variant === 'dark' && 'text-gray-800',
          variant === 'default' && 'text-gray-600'
        )}>
          Die digitale Baustelle in deiner Hosentasche.
        </span>
      )}
    </div>
  );
} 