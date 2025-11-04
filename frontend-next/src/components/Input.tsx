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
 * Uses design system tokens for consistent styling.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      description,
      className = "",
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

    // Input base styles using design tokens
    const inputBaseStyles = [
      "block",
      "w-full",
      "px-3",
      "py-2",
      "bg-surface",
      "border",
      "rounded-sm",
      "text-text",
      "placeholder:text-text-muted",
      "transition-colors",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-primary",
      "focus:ring-offset-0",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
    ].join(" ");

    // Error state styles
    const errorStyles = error
      ? "border-error focus:ring-error"
      : "border-gray-300 hover:border-gray-400";

    const inputClassName = [inputBaseStyles, errorStyles].join(" ");

    return (
      <div className={className}>
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text mb-1"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          className={inputClassName}
          {...props}
        />
        {description ? (
          <p
            id={descriptionId}
            className="mt-1 text-sm text-text-muted"
          >
            {description}
          </p>
        ) : null}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1 text-sm text-error"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
