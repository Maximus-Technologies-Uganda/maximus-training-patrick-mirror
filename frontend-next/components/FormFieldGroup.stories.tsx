import type { Meta, StoryObj } from "@storybook/react";
import { FormFieldGroup } from "./FormFieldGroup";
import { Input } from "./Input";

const meta: Meta<typeof FormFieldGroup> = {
  title: "Design System/FormFieldGroup",
  component: FormFieldGroup,
  args: {
    legend: "Contact information",
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
};
