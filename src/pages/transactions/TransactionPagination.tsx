import React from "react";
import { Table as ReactTableType } from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TransactionWithCategory } from "@/types";

interface TransactionPaginationProps {
  table: ReactTableType<TransactionWithCategory>;
}

const TransactionPagination: React.FC<TransactionPaginationProps> = ({
  table,
}) => {
  return (
    <Pagination className="py-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => {
              e.preventDefault();
              table.previousPage();
            }}
            aria-disabled={!table.getCanPreviousPage()}
            tabIndex={!table.getCanPreviousPage() ? -1 : undefined}
            className={
              !table.getCanPreviousPage()
                ? "pointer-events-none opacity-50"
                : undefined
            }
          />
        </PaginationItem>
        {[...Array(table.getPageCount()).keys()].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              isActive={table.getState().pagination.pageIndex === page}
              onClick={(e) => {
                e.preventDefault();
                table.setPageIndex(page);
              }}
            >
              {page + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={() => table.nextPage()}
            aria-disabled={!table.getCanNextPage()}
            tabIndex={!table.getCanNextPage() ? -1 : undefined}
            className={
              !table.getCanNextPage()
                ? "pointer-events-none opacity-50"
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default TransactionPagination;
