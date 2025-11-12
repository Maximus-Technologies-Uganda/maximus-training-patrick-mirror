/**
 * @file Table.test.tsx
 * @description Unit tests for Table DS primitives
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Table,
  TableHead,
  TableBody,
  TableFoot,
  TableRow,
  TableHeader,
  TableData,
} from '../Table';

describe('Table', () => {
  it('should render table element', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Column 1</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableData>Data</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should render caption when provided', () => {
    render(
      <Table caption="Users">
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
    );
    
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should render thead with th elements', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Column 1</TableHeader>
            <TableHeader>Column 2</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
    );
    
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
  });

  it('should render tbody with td elements', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableData>Cell 1</TableData>
            <TableData>Cell 2</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(2);
  });

  it('should set scope on table headers', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader scope="col">Column 1</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
    );
    
    const header = screen.getByRole('columnheader');
    expect(header).toHaveAttribute('scope', 'col');
  });

  it('should support aria-sort on headers', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader sortOrder="ascending">Sortable Column</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
    );
    
    const header = screen.getByRole('columnheader');
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  it('should render table rows', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableData>Row 1</TableData>
          </TableRow>
          <TableRow>
            <TableData>Row 2</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const rows = screen.getAllByRole('row');
    // 2 data rows (body only)
    expect(rows).toHaveLength(2);
  });

  it('should render tfoot when provided', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableData>Data</TableData>
          </TableRow>
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableData>Total</TableData>
          </TableRow>
        </TableFoot>
      </Table>
    );
    
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should support row headers (scope=row)', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHeader scope="row">Row Header</TableHeader>
            <TableData>Data</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const rowHeader = screen.getByRole('rowheader');
    expect(rowHeader).toHaveAttribute('scope', 'row');
  });

  it('should support mixed header and data cells', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableData variant="header">Name</TableData>
            <TableData>John</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const rowHeader = screen.getByRole('rowheader');
    const cell = screen.getByText('John');
    
    expect(rowHeader).toHaveTextContent('Name');
    expect(cell).toBeInTheDocument();
  });

  it('should apply hover effect to rows', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableData>Data</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const row = screen.getByRole('row');
    expect(row.className).toMatch(/hover:/);
  });

  it('should accept custom className on table', () => {
    render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableData>Data</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const table = screen.getByRole('table');
    expect(table.className).toContain('custom-table');
  });

  it('should forward refs to all components', () => {
    const tableRef = { current: null } as React.MutableRefObject<HTMLTableElement | null>;
    const headRef = { current: null } as React.MutableRefObject<HTMLTableSectionElement | null>;
    const bodyRef = { current: null } as React.MutableRefObject<HTMLTableSectionElement | null>;
    const rowRef = { current: null } as React.MutableRefObject<HTMLTableRowElement | null>;
    
    render(
      <Table ref={tableRef}>
        <TableHead ref={headRef}>
          <TableRow ref={rowRef}>
            <TableHeader>Col</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody ref={bodyRef}>
          <TableRow>
            <TableData>Data</TableData>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
    expect(headRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(bodyRef.current).toBeInstanceOf(HTMLTableSectionElement);
    expect(rowRef.current).toBeInstanceOf(HTMLTableRowElement);
  });
});
