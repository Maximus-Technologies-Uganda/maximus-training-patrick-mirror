/**
 * @file FormFieldGroup.test.tsx
 * @description Unit tests for FormFieldGroup DS primitive
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormFieldGroup } from '../FormFieldGroup';

describe('FormFieldGroup', () => {
  it('should render fieldset with legend', () => {
    render(
      <FormFieldGroup legend="Personal Information">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const legend = screen.getByText('Personal Information');
    expect(legend).toBeInTheDocument();
    expect(legend.tagName).toBe('LEGEND');
  });

  it('should render as fieldset element', () => {
    const { container } = render(
      <FormFieldGroup legend="Info">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const fieldset = container.querySelector('fieldset');
    expect(fieldset).toBeInTheDocument();
  });

  it('should display help text', () => {
    render(
      <FormFieldGroup legend="Contact" helpText="Enter your contact details">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    expect(screen.getByText('Enter your contact details')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <FormFieldGroup legend="Info" error="Please fill all fields">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    expect(screen.getByText('Please fill all fields')).toBeInTheDocument();
  });

  it('should not show help text when error is present', () => {
    render(
      <FormFieldGroup
        legend="Info"
        error="Error message"
        helpText="Help text"
      >
        <div>Content</div>
      </FormFieldGroup>
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
  });

  it('should mark error with role="alert"', () => {
    render(
      <FormFieldGroup legend="Info" error="Required field">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Required field');
  });

  it('should display required indicator', () => {
    render(
      <FormFieldGroup legend="Info" required>
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const legend = screen.getByText(/info/i);
    expect(legend.textContent).toMatch(/\*/);
  });

  it('should display description', () => {
    render(
      <FormFieldGroup
        legend="Info"
        description="Please provide accurate information"
      >
        <div>Content</div>
      </FormFieldGroup>
    );
    
    expect(screen.getByText('Please provide accurate information')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <FormFieldGroup legend="Info">
        <input type="text" placeholder="Test input" />
      </FormFieldGroup>
    );
    
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
  });

  it('should associate fieldset with help text via aria-describedby', () => {
    const { container } = render(
      <FormFieldGroup legend="Info" helpText="Help text">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const fieldset = container.querySelector('fieldset');
    const describedBy = fieldset?.getAttribute('aria-describedby');
    
    expect(describedBy).toBeTruthy();
  });

  it('should associate fieldset with error via aria-describedby', () => {
    const { container } = render(
      <FormFieldGroup legend="Info" error="Error text">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const fieldset = container.querySelector('fieldset');
    const describedBy = fieldset?.getAttribute('aria-describedby');
    
    expect(describedBy).toBeTruthy();
    if (describedBy) {
      const errorElement = document.getElementById(describedBy.split(' ')[0]);
      expect(errorElement?.textContent).toBe('Error text');
    }
  });

  it('should accept custom className', () => {
    const { container } = render(
      <FormFieldGroup legend="Info" className="custom-class">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const fieldset = container.querySelector('fieldset');
    expect(fieldset?.className).toContain('custom-class');
  });

  it('should forward ref', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLFieldSetElement | null>;
    render(
      <FormFieldGroup ref={ref} legend="Info">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLFieldSetElement);
  });

  it('should have border and padding styles', () => {
    const { container } = render(
      <FormFieldGroup legend="Info">
        <div>Content</div>
      </FormFieldGroup>
    );
    
    const fieldset = container.querySelector('fieldset');
    expect(fieldset?.className).toMatch(/border|p-/);
  });
});
