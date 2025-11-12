/**
 * @file Toast.tsx
 * @description Design System primitive: toast/notification component
 * 
 * **FR-029** (Design System): Accessible toast notification
 * 
 * Features:
 * - Info, success, warning, error variants
 * - Auto-dismiss option with countdown
 * - Close button
 * - Icon indicator
 * - Optional action button
 * - Positioned notifications
 * 
 * Accessibility:
 * - role="status" for non-critical (auto-dismiss)
 * - role="alert" for critical (errors)
 * - aria-live="polite" or "assertive"
 * - aria-label on close button
 * - aria-atomic="true" for live region
 * 
 * Usage:
 * ```tsx
 * <Toast variant="success" autoDismiss={3000}>
 *   Successfully saved!
 * </Toast>
 * <Toast variant="error" role="alert">
 *   An error occurred
 * </Toast>
 * ```
 */

import React, { useCallback, useEffect, useState } from 'react';

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Toast variant
   * @default 'info'
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  
  /**
   * Auto-dismiss after milliseconds (0 = no auto-dismiss)
   * @default 5000
   */
  autoDismiss?: number;
  
  /**
   * Callback when toast is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Optional icon
   */
  icon?: React.ReactNode;
  
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  
  /**
   * Toast content
   */
  children: React.ReactNode;
}

const variantClasses = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  error: 'bg-red-50 border-red-200 text-red-900',
};

const variantRoles = {
  info: 'status',
  success: 'status',
  warning: 'status',
  error: 'alert',
};

const iconVariants = {
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.487 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Toast component - stateful with auto-dismiss
 */
export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      variant = 'info',
      autoDismiss = 5000,
      onDismiss,
      icon,
      action,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeft, setTimeLeft] = useState(autoDismiss);
    
    const handleDismiss = useCallback(() => {
      setIsVisible(false);
      onDismiss?.();
    }, [onDismiss]);
    
    // Handle auto-dismiss
    useEffect(() => {
      if (!autoDismiss || !isVisible) return;
      
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 100) {
            handleDismiss();
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }, [autoDismiss, isVisible, handleDismiss]);
    
    if (!isVisible) return null;
    
    const role = variantRoles[variant];
    
    return (
      <div
        ref={ref}
        role={role}
        aria-atomic="true"
        aria-live={role === 'alert' ? 'assertive' : 'polite'}
        className={`
          border-l-4 rounded p-4 flex gap-3 items-start
          ${variantClasses[variant]}
          ${className}
        `.trim()}
        {...props}
      >
        {icon ? (
          <div className="flex-shrink-0 mt-0.5">{icon}</div>
        ) : (
          <div className="flex-shrink-0 mt-0.5">{iconVariants[variant]}</div>
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium">{children}</p>
        </div>
        
        <div className="flex-shrink-0 flex gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium hover:opacity-70 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-1"
              type="button"
            >
              {action.label}
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="text-sm font-medium hover:opacity-70 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-1"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 2L14 14M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        
        {autoDismiss > 0 && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-current opacity-50"
            style={{
              width: `${(timeLeft / autoDismiss) * 100}%`,
              transition: 'width 0.1s linear',
            }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';
