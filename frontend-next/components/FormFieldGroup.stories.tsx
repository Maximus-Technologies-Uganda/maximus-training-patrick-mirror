import type { Meta, StoryObj } from "@storybook/react";
import { FormFieldGroup } from "./FormFieldGroup";
import { Input } from "./Input";

/**
 * FormFieldGroup Component - Design System Primitive
 *
 * Accessibility (FR-007):
 * - ARIA role: group (implicit from <fieldset>)
 * - Legend: <legend> element provides context for grouped inputs
 * - Error handling: Error message linked via aria-describedby
 * - Screen reader: Fieldset and legend announced; grouped inputs identified
 * - Keyboard: Tab navigation through all grouped inputs
 *
 * Use for: Contact info, address, billing details, or any logically grouped form fields
 */

const meta: Meta<typeof FormFieldGroup> = {
  title: "Design System/FormFieldGroup",
  component: FormFieldGroup,
  args: {
    legend: "Contact information",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Fieldset wrapper for grouping related form inputs. Uses <legend> for semantic grouping and error state support.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormFieldGroup>;

export const Default: Story = {
  render: (args) => (
    <FormFieldGroup {...args}>
      <Input label="Email" type="email" />
      <Input label="Phone" type="tel" />
    </FormFieldGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: "Default fieldset with legend. Inputs are grouped and announced together.",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    error: "Please correct the highlighted fields.",
  },
  render: (args) => (
    <FormFieldGroup {...args}>
      <Input label="Email" type="email" />
      <Input label="Phone" type="tel" />
    </FormFieldGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Fieldset with error message. Error is announced and linked to group via aria-describedby.",
      },
    },
  },
};
