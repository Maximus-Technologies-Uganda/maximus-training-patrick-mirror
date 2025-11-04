import React, { useId } from "react";

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
  (
    {
      label,
      error,
      description,
      className,
      id,
      "aria-describedby": ariaDescribedByFromProps,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedBy = [ariaDescribedByFromProps, descriptionId, errorId]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      <div className={className}>
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {description ? (
          <p id={descriptionId}>{description}</p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
