import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

/**
 * Input Component - Design System Primitive
 *
 * Accessibility (FR-007):
 * - ARIA role: textbox (implicit from <input> element)
 * - Label: <label> associated via htmlFor attribute
 * - Required: aria-required=true when required prop set
 * - Errors: aria-invalid=true; aria-describedby links to error message
 * - Help text: aria-describedby for additional context
 * - Focus: Visible blue ring indicator on focus
 * - Keyboard: Tab navigation, Enter to submit in forms
 *
 * Supports: email, password, text, tel, url types
 */

const meta: Meta<typeof Input> = {
  title: "Design System/Input",
  component: Input,
  args: {
    label: "Email",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Accessible text input component with label, help text, and error state support. Proper ARIA attributes ensure screen reader compatibility.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
    helpText: "We will never share your email.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default input state with label, placeholder, and help text. Help text is announced by screen readers via aria-describedby.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    type: "email",
    error: "Please enter a valid email.",
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Error state. aria-invalid=true and error message is linked via aria-describedby. Required attribute is announced.",
      },
    },
  },
};
