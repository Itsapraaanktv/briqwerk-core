import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'info';
  icon?: string;
}

export function Badge({
  className,
  variant = 'default',
  icon,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export default Badge; 