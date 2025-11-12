/**
 * @file Toast.test.tsx
 * @description Unit tests for Toast DS primitive
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('should render toast with content', () => {
    render(<Toast>Success message</Toast>);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Toast variant="success">Success</Toast>);
    let toast = screen.getByText('Success').closest('[role]');
    expect(toast?.className).toMatch(/green/);

    rerender(<Toast variant="error">Error</Toast>);
    toast = screen.getByText('Error').closest('[role]');
    expect(toast?.className).toMatch(/red/);
  });

  it('should use role="status" for info, success, warning', () => {
    const { rerender } = render(<Toast variant="info">Info</Toast>);
    let toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();

    rerender(<Toast variant="success">Success</Toast>);
    toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();

    rerender(<Toast variant="warning">Warning</Toast>);
    toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
  });

  it('should use role="alert" for error variant', () => {
    render(<Toast variant="error">Error message</Toast>);
    
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Error message');
  });

  it('should set aria-live="polite" for status', () => {
    render(<Toast variant="info">Info</Toast>);
    
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('should set aria-live="assertive" for alert', () => {
    render(<Toast variant="error">Error</Toast>);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('should set aria-atomic="true"', () => {
    render(<Toast>Message</Toast>);
    
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('should render close button', () => {
    render(<Toast>Message</Toast>);
    
    const closeButton = screen.getByLabelText(/dismiss/i);
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onDismiss when closed', async () => {
    const handleDismiss = vi.fn();
    render(<Toast onDismiss={handleDismiss}>Message</Toast>);
    
    const closeButton = screen.getByLabelText(/dismiss/i);
    await userEvent.click(closeButton);
    
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it('should hide toast when dismissed', async () => {
    const { container } = render(<Toast>Message</Toast>);
    
    const closeButton = screen.getByLabelText(/dismiss/i);
    await userEvent.click(closeButton);
    
    expect(container.textContent).not.toContain('Message');
  });

  it('should auto-dismiss after specified time', async () => {
    vi.useFakeTimers();
    
    const handleDismiss = vi.fn();
    render(<Toast autoDismiss={1000} onDismiss={handleDismiss}>Message</Toast>);
    
    expect(screen.getByText('Message')).toBeInTheDocument();
    
    vi.advanceTimersByTime(1050);
    
    // Toast should be hidden
    expect(screen.queryByText('Message')).not.toBeInTheDocument();
    expect(handleDismiss).toHaveBeenCalledOnce();
    
    vi.useRealTimers();
  });

  it('should not auto-dismiss when autoDismiss is 0', async () => {
    vi.useFakeTimers();
    
    const handleDismiss = vi.fn();
    render(<Toast autoDismiss={0} onDismiss={handleDismiss}>Message</Toast>);
    
    vi.advanceTimersByTime(5000);
    
    // Should still be visible
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(handleDismiss).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should render action button when provided', () => {
    render(
      <Toast action={{ label: 'Undo', onClick: vi.fn() }}>
        Message
      </Toast>
    );
    
    const actionButton = screen.getByRole('button', { name: /undo/i });
    expect(actionButton).toBeInTheDocument();
  });

  it('should call action onClick', async () => {
    const handleAction = vi.fn();
    render(
      <Toast action={{ label: 'Undo', onClick: handleAction }}>
        Message
      </Toast>
    );
    
    const actionButton = screen.getByRole('button', { name: /undo/i });
    await userEvent.click(actionButton);
    
    expect(handleAction).toHaveBeenCalledOnce();
  });

  it('should render icon when provided', () => {
    const icon = <span data-testid="test-icon">✓</span>;
    render(<Toast icon={icon}>Message</Toast>);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should render default icon for each variant', () => {
    const { rerender, container } = render(<Toast variant="success">Message</Toast>);
    let svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    rerender(<Toast variant="error">Message</Toast>);
    svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<Toast className="custom-class">Message</Toast>);
    
    const toast = screen.getByRole('status');
    expect(toast.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLDivElement | null>;
    render(<Toast ref={ref}>Message</Toast>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should have flex layout', () => {
    const { container } = render(<Toast>Message</Toast>);
    
    const toast = container.querySelector('[role]');
    expect(toast?.className).toMatch(/flex/);
  });
});
