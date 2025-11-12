/**
 * @file Select.tsx
 * @description Design System primitive: accessible select dropdown component
 * 
 * **FR-029** (Design System): Accessible select with ARIA semantics
 * 
 * Features:
 * - Semantic <select> element
 * - Associated <label>
 * - Error state with aria-invalid
 * - Help text with aria-describedby
 * - Required indicator
 * - Disabled state
 * - Optional grouping with <optgroup>
 * 
 * Accessibility:
 * - <label htmlFor> explicit association
 * - aria-describedby for help/error
 * - aria-invalid="true" on error
 * - aria-required="true" when required
 * - Semantic <option> and <optgroup>
 */

import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label text
   */
  label: string;
  
  /**
   * Options or option groups
   */
  options: (SelectOption | SelectGroup)[];
  
  /**
   * Placeholder option text
   */
  placeholder?: string;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Help text
   */
  helpText?: string;
  
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Full width
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Helper: Check if option is a group
 */
function isGroup(option: SelectOption | SelectGroup): option is SelectGroup {
  return 'options' in option;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helpText,
      size = 'md',
      fullWidth = false,
      id,
      required,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const helpId = `${selectId}-help`;
    const errorId = `${selectId}-error`;
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };
    
    const fullWidthClass = fullWidth ? 'w-full' : '';
    
    const selectClasses = `
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
        <label htmlFor={selectId} className="block mb-1 font-medium text-gray-900">
          {label}
          {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
        
        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helpText ? helpId : undefined}
          aria-required={required}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          
          {options.map((option, idx) => {
            if (isGroup(option)) {
              return (
                <optgroup key={idx} label={option.label}>
                  {option.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              );
            }
            
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>
        
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

Select.displayName = 'Select';
