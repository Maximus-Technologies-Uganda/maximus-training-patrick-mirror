/**
 * @file Button.test.tsx
 * @description Unit tests for Button DS primitive
 * 
 * Tests:
 * - Renders with correct variant and size
 * - Disabled and loading states
 * - Keyboard accessibility (Enter/Space)
 * - ARIA attributes (aria-busy, aria-disabled, aria-label)
 * - Focus visible
 * - Icon rendering
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('should render as a button element', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toMatch(/blue-600/);

    rerender(<Button variant="danger">Danger</Button>);
    button = screen.getByRole('button');
    expect(button.className).toMatch(/red-600/);
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toMatch(/text-sm/);

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button.className).toMatch(/text-lg/);
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.className).toMatch(/disabled:/);
  });

  it('should set aria-busy on loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('should display loadingText when loading', () => {
    render(<Button loading loadingText="Saving...">Click me</Button>);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} loading>Click me</Button>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should support keyboard activation (Enter)', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await userEvent.keyboard('{Enter}');
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should support keyboard activation (Space)', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await userEvent.keyboard(' ');
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should render icon when provided', () => {
    const icon = <span data-testid="test-icon">📝</span>;
    render(<Button icon={icon}>Click me</Button>);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should apply fullWidth class', () => {
    render(<Button fullWidth>Full width button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toMatch(/w-full/);
  });

  it('should support aria-label', () => {
    render(<Button aria-label="Custom label">Icon only</Button>);
    const button = screen.getByRole('button', { name: /custom label/i });
    expect(button).toBeInTheDocument();
  });

  it('should forward ref', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLButtonElement | null>;
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should have focus visible styles', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toMatch(/focus-visible:/);
  });
});
