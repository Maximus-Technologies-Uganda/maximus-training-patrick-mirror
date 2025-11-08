import React, { useId } from "react";
import { cn } from "../lib/utils";

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
 *
 * ## Security
 *
 * **Input Sanitization:** This component accepts plain-text strings only for
 * label, error, and description props. All text is rendered via React's default
 * text rendering which automatically escapes HTML/script content, preventing XSS.
 *
 * **Constraint:** Do NOT pass HTML or JSX to label/error/description props.
 * Use plain strings only. React will escape any HTML entities automatically.
 *
 * @example
 * // ✅ Good - Plain text
 * <Input label="Username" error="Username is required" />
 *
 * @example
 * // ❌ Bad - HTML (will be escaped and displayed as literal text)
 * <Input label="<strong>Username</strong>" />
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

    const inputClassName = cn(
      // Base styles using design tokens
      "block",
      "w-full",
      "px-2",
      "py-1",
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
      // Error state styles
      error ? "border-error focus:ring-error" : "border-text-muted/40 hover:border-text-muted/60"
    );

    return (
      <div className={className}>
        {label ? (
          <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1">
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
          <p id={descriptionId} className="mt-1 text-sm text-text-muted">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
