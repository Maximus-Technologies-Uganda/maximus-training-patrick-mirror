import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

/**
 * Button Component - Design System Primitive
 *
 * Accessibility (FR-007):
 * - ARIA role: button (native <button> element)
 * - Keyboard: Enter and Space keys activate button
 * - Focus: Visible blue ring indicator on focus
 * - Disabled state: aria-disabled=true; pointer-events: none
 * - Loading state: aria-busy=true; aria-label updated
 *
 * Variants: primary (blue), secondary (gray)
 */

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Accessible button component with primary/secondary variants. Supports disabled and loading states with proper ARIA attributes.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Primary button",
    variant: "primary",
  },
  parameters: {
    docs: {
      description: {
        story: "Primary button variant for main actions. Uses blue background.",
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary button",
    variant: "secondary",
  },
  parameters: {
    docs: {
      description: {
        story: "Secondary button variant for less important actions. Uses gray background.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled button",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Disabled state. Button is not clickable and has reduced opacity. Assistive technologies announce as disabled.",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    children: "Save",
    loading: true,
    loadingText: "Saving...",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Loading state with spinner and loading text. aria-busy=true indicates asynchronous operation in progress.",
      },
    },
  },
};
