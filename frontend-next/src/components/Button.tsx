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
  ({ variant: _variant = 'primary', loading = false, size: _size = 'md', className, disabled, ...props }, ref) => {
    // TODO: Implement button variants with token-based styling
    // - Use --color-primary, --color-surface tokens
    // - Support loading state with aria-busy
    // - Add focus ring using --radius-* tokens
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={className}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
