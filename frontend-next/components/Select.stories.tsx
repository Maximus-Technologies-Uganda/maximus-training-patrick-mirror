import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

/**
 * Select Component - Design System Primitive
 *
 * Accessibility (FR-007):
 * - ARIA role: combobox (implicit from <select> element)
 * - Label: <label> associated via htmlFor attribute
 * - Required: aria-required=true when required prop set
 * - Errors: aria-invalid=true; aria-describedby links to error message
 * - Keyboard: Arrow keys navigate options; Enter/Space select
 * - Focus: Visible focus indicator on select element
 * - Screen reader: Options announced individually
 */

const meta: Meta<typeof Select> = {
  title: "Design System/Select",
  component: Select,
  args: {
    label: "Status",
    options: [
      { value: "", label: "All" },
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "Accessible select/dropdown component with label and error state support. Options are announced to screen readers individually.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "Default select state with label and options. Arrow keys navigate; Enter selects option.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    error: "Please select a status.",
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Error state with required indicator. aria-invalid=true and error message linked via aria-describedby.",
      },
    },
  },
};
