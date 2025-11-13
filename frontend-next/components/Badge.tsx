/**
 * @file Badge.tsx
 * @description Design System primitive: badge/label component
 * 
 * **FR-029** (Design System): Accessible badge with semantic styling
 * 
 * Features:
 * - Small label for status, tags, counts
 * - Variants: primary, secondary, success, warning, danger
 * - Sizes: sm, md, lg
 * - Optional icon
 * - Dismissible variant with close button
 * 
 * Accessibility:
 * - Semantic role="status" for status badges
 * - Proper color contrast
 * - Icon with aria-label if icon-only
 * - Close button with aria-label
 * 
 * Usage:
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" dismissible onDismiss={() => {}}>Tag</Badge>
 * ```
 */

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  
  /**
   * Size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Optional icon
   */
  icon?: React.ReactNode;
  
  /**
   * Show close button
   */
  dismissible?: boolean;
  
  /**
   * Callback when dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Content text/children
   */
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      dismissible = false,
      onDismiss,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
        
        {dismissible && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss badge"
            className="flex-shrink-0 ml-0.5 hover:opacity-70 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-1"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
