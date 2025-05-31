import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  fullWidth?: boolean;
}

const variants = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-md',
  outlined: 'border border-gray-200',
};

const paddings = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  clickable = false,
  fullWidth = true,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-lg
        transition-shadow duration-200
        ${variants[variant]}
        ${paddings[padding]}
        ${clickable ? 'hover:shadow-lg cursor-pointer' : ''}
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`p-4 md:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`p-4 md:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
}

// Re-export all components
export { Card as default }; 