import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = {
  args: {
    variant: "success",
    children: "Active",
  },
};

export const WarningDismissible: Story = {
  args: {
    variant: "warning",
    children: "Expiring soon",
    dismissible: true,
  },
};
