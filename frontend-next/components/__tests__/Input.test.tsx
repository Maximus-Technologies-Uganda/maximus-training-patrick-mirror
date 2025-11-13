/**
 * @file Input.test.tsx
 * @description Unit tests for Input DS primitive
 * 
 * Tests:
 * - Renders with label and input
 * - aria-describedby for help/error text
 * - aria-invalid on error state
 * - aria-required when required
 * - Error message displayed with role="alert"
 * - Help text shown when no error
 * - Disabled state
 * - Various input types
 * - Focus visible
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Input } from '../Input';

describe('Input', () => {
  it('should render label and input', () => {
    render(<Input label="Email" type="email" />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should associate label with input via htmlFor', () => {
    render(<Input label="Email" type="email" id="custom-id" />);
    
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'custom-id');
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('should generate unique ID if not provided', () => {
    const { rerender } = render(<Input label="First" />);
    const firstInput = screen.getByLabelText('First') as HTMLInputElement;
    const firstId = firstInput.id;
    
    rerender(<Input label="Second" />);
    const secondInput = screen.getByLabelText('Second') as HTMLInputElement;
    const secondId = secondInput.id;
    
    expect(firstId).not.toBe(secondId);
    expect(firstId).toMatch(/input-/);
  });

  it('should display error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should set aria-invalid on error', () => {
    render(<Input label="Email" error="Invalid email" />);
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should associate error with aria-describedby', () => {
    render(<Input label="Email" error="Invalid email" />);
    
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    const describedBy = input.getAttribute('aria-describedby');
    
    expect(describedBy).toBeTruthy();
    const errorElement = document.getElementById(describedBy!);
    expect(errorElement?.textContent).toBe('Invalid email');
  });

  it('should mark error message with role="alert"', () => {
    render(<Input label="Email" error="Invalid email" />);
    
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Invalid email');
  });

  it('should display help text when no error', () => {
    render(<Input label="Email" helpText="Enter your email address" />);
    
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('should associate help text with aria-describedby', () => {
    render(<Input label="Email" helpText="Enter your email" />);
    
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    const describedBy = input.getAttribute('aria-describedby');
    
    expect(describedBy).toBeTruthy();
    const helpElement = document.getElementById(describedBy!);
    expect(helpElement?.textContent).toBe('Enter your email');
  });

  it('should not show help text when error is present', () => {
    render(
      <Input
        label="Email"
        error="Invalid email"
        helpText="Enter your email address"
      />
    );
    
    // Error should be shown
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    
    // Help text should not be shown
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
  });

  it('should mark required field', () => {
    render(<Input label="Email" required />);
    
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should display required indicator', () => {
    render(<Input label="Email" required />);
    
    const label = screen.getByText('Email').closest('label');
    expect(label?.textContent).toMatch(/\*/);
  });

  it('should handle disabled state', () => {
    render(<Input label="Email" disabled />);
    
    const input = screen.getByLabelText('Email');
    expect(input).toBeDisabled();
  });

  it('should set input type', () => {
    render(<Input label="Email" type="email" />);
    
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('should accept different input types', () => {
    const types = ['text', 'email', 'password', 'tel', 'number', 'date'] as const;
    
    types.forEach((type) => {
      const { unmount } = render(
        <Input label={`${type} field`} type={type} />
      );
      
      const input = screen.getByLabelText(`${type} field`) as HTMLInputElement;
      expect(input.type).toBe(type);
      
      unmount();
    });
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Input label="Field" size="sm" />);
    let input = screen.getByLabelText('Field');
    expect(input.className).toMatch(/text-sm/);

    rerender(<Input label="Field" size="lg" />);
    input = screen.getByLabelText('Field');
    expect(input.className).toMatch(/text-lg/);
  });

  it('should apply fullWidth class', () => {
    render(<Input label="Field" fullWidth />);
    
    const input = screen.getByLabelText('Field');
    expect(input.className).toMatch(/w-full/);
  });

  it('should forward ref', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLInputElement | null>;
    render(<Input ref={ref} label="Email" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('text');
  });

  it('should accept custom className', () => {
    render(<Input label="Email" className="custom-class" />);
    
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('custom-class');
  });

  it('should have focus visible styles', () => {
    render(<Input label="Email" />);
    
    const input = screen.getByLabelText('Email');
    expect(input.className).toMatch(/focus-visible:/);
  });

  it('should handle placeholder text', () => {
    render(<Input label="Email" placeholder="user@example.com" />);
    
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.placeholder).toBe('user@example.com');
  });

  it('should handle default values', () => {
    render(<Input label="Email" defaultValue="test@example.com" />);
    
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.value).toBe('test@example.com');
  });
});
