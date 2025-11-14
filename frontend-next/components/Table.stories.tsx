import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableData } from "./Table";

const meta: Meta<typeof Table> = {
  title: "Design System/Table",
  component: Table,
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
};
