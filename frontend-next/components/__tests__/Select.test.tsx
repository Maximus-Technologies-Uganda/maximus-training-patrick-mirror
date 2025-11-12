/**
 * @file Select.test.tsx
 * @description Unit tests for Select DS primitive
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from '../Select';

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  it('should render label and select', () => {
    render(<Select label="Choose option" options={options} />);
    
    expect(screen.getByLabelText(/choose option/i)).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<Select label="Choose" options={options} />);
    
    expect(screen.getByRole('option', { name: /option 1/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /option 2/i })).toBeInTheDocument();
  });

  it('should render placeholder option', () => {
    render(
      <Select label="Choose" options={options} placeholder="Select one..." />
    );
    
    expect(screen.getByRole('option', { name: /select one/i })).toBeInTheDocument();
  });

  it('should set aria-invalid on error', () => {
    render(<Select label="Choose" options={options} error="Required field" />);
    
    const select = screen.getByLabelText(/choose/i);
    expect(select).toHaveAttribute('aria-invalid', 'true');
  });

  it('should display error message', () => {
    render(<Select label="Choose" options={options} error="Required field" />);
    
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('should mark required field', () => {
    render(<Select label="Choose" options={options} required />);
    
    const select = screen.getByLabelText(/choose/i);
    expect(select).toHaveAttribute('required');
    expect(select).toHaveAttribute('aria-required', 'true');
  });

  it('should handle disabled state', () => {
    render(<Select label="Choose" options={options} disabled />);
    
    const select = screen.getByLabelText(/choose/i);
    expect(select).toBeDisabled();
  });

  it('should support option groups', () => {
    const groupedOptions = [
      {
        label: 'Group 1',
        options: [
          { value: 'g1o1', label: 'Group 1 Option 1' },
          { value: 'g1o2', label: 'Group 1 Option 2' },
        ],
      },
      {
        label: 'Group 2',
        options: [
          { value: 'g2o1', label: 'Group 2 Option 1' },
        ],
      },
    ];
    
    render(<Select label="Choose" options={groupedOptions as Array<{ label: string; options: Array<{ value: string; label: string }> } | { value: string; label: string }>} />);
    
    const optgroups = screen.getAllByRole('group');
    expect(optgroups.length).toBeGreaterThan(0);
  });

  it('should forward ref', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLSelectElement | null>;
    render(<Select ref={ref} label="Choose" options={options} />);
    
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('should have focus visible styles', () => {
    render(<Select label="Choose" options={options} />);
    
    const select = screen.getByLabelText(/choose/i);
    expect(select.className).toMatch(/focus-visible:/);
  });
});
