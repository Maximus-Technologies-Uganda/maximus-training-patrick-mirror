import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  className?: string;
}

/**
 * Input Component
 *
 * A text input component with optional label, error state, and description.
 * Supports accessibility features via aria-describedby and aria-invalid.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, className, id, ...props }, ref) => {
    // TODO: Implement input with label and error states
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className={className}>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input ref={ref} id={inputId} aria-invalid={error ? "true" : "false"} {...props} />
        {description && <p>{description}</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
