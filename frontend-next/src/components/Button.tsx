import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional CSS class */
  className?: string;
}

/**
 * Button Component
 *
 * A versatile button component supporting multiple variants and states.
 * Uses design system tokens for consistent styling across the application.
 *
 * @example
 * <Button variant="primary">Click me</Button>
 * <Button variant="secondary" disabled>Disabled</Button>
 * <Button loading>Loading...</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, size = 'md', className = '', disabled, children, ...props }, ref) => {
    // Base styles: common to all variants
    const baseStyles = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ].join(' ');

    // Variant styles using design tokens
    const variantStyles: Record<string, string> = {
      primary: [
        'bg-primary',
        'text-surface',
        'hover:bg-gray-800',
        'focus:ring-primary',
        'border-transparent',
      ].join(' '),
      secondary: [
        'bg-surface',
        'text-primary',
        'border',
        'border-gray-300',
        'hover:bg-gray-50',
        'focus:ring-primary',
      ].join(' '),
      ghost: [
        'bg-transparent',
        'text-primary',
        'hover:bg-gray-100',
        'focus:ring-primary',
        'border-transparent',
      ].join(' '),
    };

    // Size styles using design tokens
    const sizeStyles: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm rounded-sm',
      md: 'px-4 py-2 text-base rounded-md',
      lg: 'px-6 py-3 text-lg rounded-lg',
    };

    const combinedClassName = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={combinedClassName}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
