/**
 * @file Input.tsx
 * @description Design System primitive: accessible text input component
 * 
 * **FR-029** (Design System): Accessible input with ARIA semantics
 * 
 * Features:
 * - Semantic <input> element
 * - Associated <label> element
 * - Error state with aria-invalid
 * - Help text with aria-describedby
 * - Required indicator with aria-required
 * - Disabled state
 * - Full keyboard accessibility
 * - Focus visible indicator
 * 
 * Accessibility:
 * - <label htmlFor> explicit association
 * - aria-describedby for help/error text
 * - aria-invalid="true" on error
 * - aria-required="true" when required
 * - type attribute for semantics (text, email, password, etc.)
 * 
 * Usage:
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   error="Invalid email format"
 *   required
 * />
 * ```
 */

import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label text - required for accessibility
   */
  label: string;
  
  /**
   * Error message - displays and sets aria-invalid
   */
  error?: string;
  
  /**
   * Help text displayed below input
   */
  helpText?: string;
  
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Full width input
   * @default false
   */
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      size = 'md',
      fullWidth = false,
      id,
      type = 'text',
      required,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helpId = `${inputId}-help`;
    const errorId = `${inputId}-error`;
    
    // Size styles
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };
    
    const fullWidthClass = fullWidth ? 'w-full' : '';
    
    const inputClasses = `
      border-2 rounded transition-colors
      focus-visible:outline-2 focus-visible:outline-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error ? 'border-red-500 focus-visible:outline-red-500' : 'border-gray-300 focus-visible:outline-blue-500'}
      ${sizeClasses[size]}
      ${fullWidthClass}
      ${className}
    `.trim();
    
    return (
      <div className={fullWidthClass ? 'w-full' : ''}>
        <label htmlFor={inputId} className="block mb-1 font-medium text-gray-900">
          {label}
          {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          aria-required={required}
          className={inputClasses}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p id={helpId} className="mt-1 text-sm text-gray-600">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
