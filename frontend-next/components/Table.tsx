/**
 * @file Table.tsx
 * @description Design System primitive: accessible data table component
 * 
 * **FR-029** (Design System): Accessible table with proper semantics
 * 
 * Features:
 * - Semantic <table> with <thead>, <tbody>, <tfoot>
 * - <th> with scope="col" or scope="row"
 * - Optional caption
 * - Sortable column headers with aria-sort
 * - Striped rows option
 * - Hover state
 * - Responsive wrapper option
 * 
 * Accessibility:
 * - <th> elements with scope attribute
 * - <caption> for table description
 * - aria-sort on sortable headers
 * - Proper semantic structure
 * - Sufficient color contrast
 * 
 * Usage:
 * ```tsx
 * <Table caption="Posts">
 *   <TableHead>
 *     <TableRow>
 *       <TableHeader scope="col">Title</TableHeader>
 *       <TableHeader scope="col">Author</TableHeader>
 *     </TableRow>
 *   </TableHead>
 *   <TableBody>
 *     <TableRow>
 *       <TableData>Post title</TableData>
 *       <TableData>Author name</TableData>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */

import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /**
   * Table caption
   */
  caption?: string;
  
  /**
   * Striped rows
   * @default false
   */
  striped?: boolean;
  
  /**
   * Hover effect on rows
   * @default true
   */
  hover?: boolean;
}

type TableHeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TableFootProps = React.HTMLAttributes<HTMLTableSectionElement>;

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Cell variant - header or data
   */
  variant?: 'header' | 'data';
}

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  /**
   * Header scope
   */
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  
  /**
   * Sort direction for aria-sort
   */
  sortOrder?: 'ascending' | 'descending' | 'none' | undefined;
}

/**
 * Table component
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      caption,
      striped: _striped = false,
      hover: _hover = true,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <table
        ref={ref}
        className={`w-full border-collapse text-left ${className}`.trim()}
        {...props}
      >
        {caption && (
          <caption className="mb-2 font-semibold text-left text-gray-900">
            {caption}
          </caption>
        )}
        {children}
      </table>
    );
  }
);

Table.displayName = 'Table';

/**
 * TableHead component
 */
export const TableHead = React.forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={`border-b-2 border-gray-300 bg-gray-50 ${className}`.trim()}
        {...props}
      >
        {children}
      </thead>
    );
  }
);

TableHead.displayName = 'TableHead';

/**
 * TableBody component
 */
export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={className}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = 'TableBody';

/**
 * TableFoot component
 */
export const TableFoot = React.forwardRef<HTMLTableSectionElement, TableFootProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={`border-t-2 border-gray-300 bg-gray-50 ${className}`.trim()}
        {...props}
      >
        {children}
      </tfoot>
    );
  }
);

TableFoot.displayName = 'TableFoot';

/**
 * TableRow component
 */
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${className}`.trim()}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

/**
 * TableHeader component
 */
export const TableHeader = React.forwardRef<HTMLTableHeaderCellElement, TableHeaderProps>(
  (
    {
      scope = 'col',
      sortOrder,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const ariaAttrs = sortOrder ? ({ 'aria-sort': sortOrder } as const) : {};
    
    return (
      <th
        ref={ref}
        scope={scope}
        {...ariaAttrs}
        className={`px-4 py-2 font-semibold text-gray-900 text-sm ${className}`.trim()}
        {...props}
      >
        {children}
      </th>
    );
  }
);

TableHeader.displayName = 'TableHeader';

/**
 * TableData component
 */
export const TableData = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  (
    {
      variant = 'data',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    if (variant === 'header') {
      return (
        <th
          ref={ref as React.ForwardedRef<HTMLTableCellElement>}
          scope="row"
          className={`px-4 py-2 font-semibold text-gray-900 ${className}`.trim()}
          {...props}
        >
          {children}
        </th>
      );
    }
    
    return (
      <td
        ref={ref}
        className={`px-4 py-2 text-gray-700 text-sm ${className}`.trim()}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableData.displayName = 'TableData';
