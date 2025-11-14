import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

/**
 * Badge Component - Design System Primitive
 *
 * Accessibility (FR-007):
 * - ARIA role: status (for informational badges)
 * - Semantic variants: success (green), warning (yellow), danger (red), info (blue)
 * - Dismissible state: Close button with aria-label="Dismiss {variant} badge"
 * - Screen reader: Badge text announced; dismissible state announced
 * - Color not sole differentiator: Icon or text label clarifies meaning
 */

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "Status badge component with semantic color variants (success, warning, danger, info). Supports dismissible close button with proper ARIA attributes.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = {
  args: {
    variant: "success",
    children: "Active",
  },
  parameters: {
    docs: {
      description: {
        story: "Success variant (green). Announces status to screen readers via role=status.",
      },
    },
  },
};

export const WarningDismissible: Story = {
  args: {
    variant: "warning",
    children: "Expiring soon",
    dismissible: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Warning variant (yellow) with dismissible close button. Close button has aria-label for accessibility.",
      },
    },
  },
};
