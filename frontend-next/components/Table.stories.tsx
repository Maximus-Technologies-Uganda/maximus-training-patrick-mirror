import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableData } from "./Table";

/**
 * Table Component - Design System Primitive
 *
 * Accessibility (FR-007):
 * - Caption: Provides title for screen readers (<caption> element)
 * - Headers: scope="col" identifies column headers; scope="row" for row headers
 * - Semantic HTML: <thead>, <tbody> clarify structure
 * - Screen reader: Table announced; headers associated with data cells
 * - Keyboard: Tab navigation through cells (custom handlers can add keyboard nav)
 * - Sortable columns: aria-sort attribute for sort state (if implemented)
 *
 * Use for: Data display, lists with multiple columns (posts, items, records)
 */

const meta: Meta<typeof Table> = {
  title: "Design System/Table",
  component: Table,
  parameters: {
    docs: {
      description: {
        component:
          "Accessible data table component with semantic HTML structure. Caption and scope attributes ensure screen reader compatibility.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Basic: Story = {
  render: () => (
    <Table caption="Posts">
      <TableHead>
        <TableRow>
          <TableHeader scope="col">Title</TableHeader>
          <TableHeader scope="col">Author</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableData>First post</TableData>
          <TableData>Alice</TableData>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Basic table with caption, headers, and data. Headers have scope='col' for proper association.",
      },
    },
  },
};
