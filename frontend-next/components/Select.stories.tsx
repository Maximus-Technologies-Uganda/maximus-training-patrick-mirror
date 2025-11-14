import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

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
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    error: "Please select a status.",
    required: true,
  },
};
