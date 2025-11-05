import React from 'react';
import { cn } from '../lib/utils';

// Type-safe variant and size definitions
const BUTTON_VARIANTS = {
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
} as const;

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
} as const;

const BUTTON_BASE_STYLES = [
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

// Type-safe variants and sizes
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Button size */
  size?: ButtonSize;
  /** Optional CSS class */
  className?: string;
}

/**
 * Button Component
 *
 * A versatile button component supporting multiple variants and states.
 * Uses design system tokens for consistent styling across the application.
 *
 * **Form Behavior:**
 * - Defaults to `type="button"` to prevent accidental form submission
 * - Override with `type="submit"` when you need to submit a form
 *
 * @example
 * <Button variant="primary">Click me</Button>
 * <Button variant="secondary" disabled>Disabled</Button>
 * <Button loading>Loading...</Button>
 * <Button type="submit">Submit Form</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, size = 'md', className, disabled, type = 'button', children, ...props }, ref) => {
    const combinedClassName = cn(
      BUTTON_BASE_STYLES,
      BUTTON_VARIANTS[variant],
      BUTTON_SIZES[size],
      className
    );

    return (
      <button
        ref={ref}
        type={type}
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
