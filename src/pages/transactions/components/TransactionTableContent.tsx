import React from "react";
import { useTranslation } from "react-i18next";
import { flexRender, Table as ReactTableType } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionWithCategory } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface TransactionTableContentProps {
  table: ReactTableType<TransactionWithCategory>;
  loading: boolean;
}

const TransactionTableContent: React.FC<TransactionTableContentProps> = ({
  table,
  loading,
}) => {
  const { t } = useTranslation();
  const columns = table.getAllColumns(); // Get all columns from the table instance

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8 text-primary" />
          <span className="text-sm font-medium text-muted-foreground animate-pulse">
            {t("loading")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize(), position: "relative" }}
                  data-size={header.getSize()}
                  className="relative h-12 text-left align-middle font-bold text-foreground [&:has([role=checkbox])]:pr-0 group/table-head bg-muted"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  <div
                    {...{
                      onMouseDown: header.getResizeHandler(),
                      onTouchStart: header.getResizeHandler(),
                      className: `resizer ${
                        header.column.getIsResizing() ? "isResizing" : ""
                      }`,
                      style: {
                        transform: header.column.getIsResizing()
                          ? `translateX(${
                              table.getState().columnSizingInfo.deltaOffset
                            }px)`
                          : "",
                      },
                    }}
                    className="absolute right-0 top-0 h-full w-1 cursor-ew-resize select-none touch-action-none opacity-0 data-[state=active]:opacity-100 group-hover/table-head:opacity-100"
                    data-state={
                      header.column.getIsResizing() ? "active" : "inactive"
                    }
                  />
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="group"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {t("no_transactions_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTableContent;
