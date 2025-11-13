/**
 * @file FormFieldGroup.tsx
 * @description Design System primitive: grouped form field container
 * 
 * **FR-029** (Design System): Accessible form field group with legend
 * 
 * Features:
 * - Semantic <fieldset> wrapper
 * - <legend> for group label
 * - Helper text
 * - Error state
 * - Multiple child inputs
 * - Optional required indicator
 * 
 * Accessibility:
 * - <fieldset> and <legend> for grouping
 * - aria-describedby for help/error
 * - Proper label association for child inputs
 * - Error role="alert"
 * 
 * Usage:
 * ```tsx
 * <FormFieldGroup legend="Contact Information" required>
 *   <Input label="Email" type="email" />
 *   <Input label="Phone" type="tel" />
 * </FormFieldGroup>
 * ```
 */

import React from 'react';

interface FormFieldGroupProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /**
   * Legend text (fieldset title)
   */
  legend: string;
  
  /**
   * Help text displayed below inputs
   */
  helpText?: string;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Required indicator
   */
  required?: boolean;
  
  /**
   * Field group description
   */
  description?: string;
  
  /**
   * Child inputs
   */
  children: React.ReactNode;
}

export const FormFieldGroup = React.forwardRef<HTMLFieldSetElement, FormFieldGroupProps>(
  (
    {
      legend,
      helpText,
      error,
      required,
      description,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const groupId = `fieldset-${Math.random().toString(36).substr(2, 9)}`;
    const helpId = `${groupId}-help`;
    const errorId = `${groupId}-error`;
    const descId = `${groupId}-desc`;
    
    return (
      <fieldset
        ref={ref}
        className={`border border-gray-300 rounded-lg p-4 ${className}`.trim()}
        aria-describedby={
          (error ? errorId : '') + (helpText || description ? ` ${helpText ? helpId : descId}` : '')
        }
        {...props}
      >
        <legend className="text-lg font-semibold text-gray-900 mb-4">
          {legend}
          {required && <span className="text-red-600" aria-label="required"> *</span>}
        </legend>
        
        {description && (
          <p id={descId} className="mb-4 text-sm text-gray-600">
            {description}
          </p>
        )}
        
        <div className="space-y-4">
          {children}
        </div>
        
        {error && (
          <p id={errorId} className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p id={helpId} className="mt-4 text-sm text-gray-600">
            {helpText}
          </p>
        )}
      </fieldset>
    );
  }
);

FormFieldGroup.displayName = 'FormFieldGroup';
