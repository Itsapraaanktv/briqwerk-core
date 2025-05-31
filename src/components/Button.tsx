import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { components } from '../styles/design-system';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof components.button.variants;
  size?: keyof typeof components.button.sizes;
  icon?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = components.button.base;
  const variantClasses = components.button.variants[variant];
  const sizeClasses = components.button.sizes[size];

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses}
        ${sizeClasses}
        ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
        flex items-center justify-center
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
} 