/**
 * @file Badge.test.tsx
 * @description Unit tests for Badge DS primitive
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('should render badge with text', () => {
    render(<Badge>Active</Badge>);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    let badge = screen.getByText('Success').closest('div');
    expect(badge?.className).toMatch(/green/);

    rerender(<Badge variant="danger">Danger</Badge>);
    badge = screen.getByText('Danger').closest('div');
    expect(badge?.className).toMatch(/red/);
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    let badge = screen.getByText('Small').closest('div');
    expect(badge?.className).toMatch(/text-xs/);

    rerender(<Badge size="lg">Large</Badge>);
    badge = screen.getByText('Large').closest('div');
    expect(badge?.className).toMatch(/text-base/);
  });

  it('should render icon when provided', () => {
    const icon = <span data-testid="badge-icon">✓</span>;
    render(<Badge icon={icon}>Active</Badge>);
    
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('should show close button when dismissible', () => {
    render(<Badge dismissible>Tag</Badge>);
    
    const closeButton = screen.getByLabelText(/dismiss/i);
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onDismiss when closed', async () => {
    const handleDismiss = vi.fn();
    render(<Badge dismissible onDismiss={handleDismiss}>Tag</Badge>);
    
    const closeButton = screen.getByLabelText(/dismiss/i);
    await userEvent.click(closeButton);
    
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it('should not show close button when not dismissible', () => {
    render(<Badge>Tag</Badge>);
    
    const closeButton = screen.queryByLabelText(/dismiss/i);
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<Badge className="custom-class">Tag</Badge>);
    
    const badge = screen.getByText('Tag').closest('div');
    expect(badge?.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLDivElement | null>;
    render(<Badge ref={ref}>Badge</Badge>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should be inline-flex by default', () => {
    render(<Badge>Tag</Badge>);
    
    const badge = screen.getByText('Tag').closest('div');
    expect(badge?.className).toMatch(/inline-flex/);
  });
});
