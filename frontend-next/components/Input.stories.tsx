import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Design System/Input",
  component: Input,
  args: {
    label: "Email",
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
};

export const WithError: Story = {
  args: {
    type: "email",
    error: "Please enter a valid email.",
    required: true,
  },
};
