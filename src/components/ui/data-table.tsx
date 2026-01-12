import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Data Table - Following skill.md design principles
 * - Monospace for data columns
 * - Uppercase tracking-wider headers
 * - Subtle hover states
 * - Border-based separation
 */
export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border", className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

interface DataTableHeaderProps {
  children: ReactNode;
}

export function DataTableHeader({ children }: DataTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-muted/50 border-b border-border">
        {children}
      </tr>
    </thead>
  );
}

interface DataTableHeaderCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTableHeaderCell({ children, className, align = "left" }: DataTableHeaderCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <th className={cn(
      "px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
      alignClass[align],
      className
    )}>
      {children}
    </th>
  );
}

interface DataTableBodyProps {
  children: ReactNode;
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface DataTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr 
      className={cn(
        "border-b border-border last:border-b-0",
        onClick && "cursor-pointer",
        "transition-micro hover:bg-muted/30",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface DataTableCellProps {
  children: ReactNode;
  className?: string;
  mono?: boolean;
  align?: "left" | "center" | "right";
}

export function DataTableCell({ children, className, mono = false, align = "left" }: DataTableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <td className={cn(
      "px-4 py-3",
      mono && "font-mono tabular-nums",
      alignClass[align],
      className
    )}>
      {children}
    </td>
  );
}

interface DataTableEmptyProps {
  colSpan: number;
  children?: ReactNode;
}

export function DataTableEmpty({ colSpan, children }: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
        {children || "Nenhum dado encontrado"}
      </td>
    </tr>
  );
}
