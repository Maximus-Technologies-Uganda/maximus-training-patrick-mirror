/**
 * Utility Functions
 *
 * Common utility functions used across components.
 */

/**
 * Merge class names into a single string, filtering out falsy values
 *
 * @param classes - Array of class names or falsy values
 * @returns Merged class name string
 *
 * @example
 * cn('base-class', condition && 'conditional-class', 'another-class')
 * // => 'base-class conditional-class another-class' (if condition is true)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
