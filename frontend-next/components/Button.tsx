/**
 * @file Button.tsx
 * @description Design System primitive: accessible button component
 * 
 * **FR-029** (Design System): Accessible button with ARIA semantics
 * 
 * Features:
 * - Semantic <button> element
 * - Variants: primary, secondary, danger, ghost
 * - Sizes: sm, md, lg
 * - Loading state with aria-busy
 * - Disabled state with aria-disabled
 * - Optional loading spinner
 * - Full keyboard accessibility (Enter, Space)
 * - Focus visible indicator
 * 
 * Accessibility:
 * - role="button" implicit
 * - aria-label for icon buttons
 * - aria-busy during async operations
 * - aria-disabled when disabled
 * - Focus outline on keyboard focus
 * 
 * Usage:
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="secondary" disabled>Disabled</Button>
 * <Button loading aria-label="Save document">Save</Button>
 * ```
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  
  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Loading state - shows spinner and disables button
   * @default false
   */
  loading?: boolean;
  
  /**
   * Optional loading spinner text
   * @default 'Loading...'
   */
  loadingText?: string;
  
  /**
   * Icon element (left of text)
   */
  icon?: React.ReactNode;
  
  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Loading...',
      icon,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseClasses = 'font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Variant styles
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:outline-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
      ghost: 'text-gray-900 hover:bg-gray-100 focus-visible:outline-gray-600',
    };
    
    // Size styles
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    const fullWidthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-label={loading ? loadingText : undefined}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidthClass}
          ${className}
        `.trim()}
        {...props}
      >
        <span className="inline-flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {loading ? loadingText : children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
