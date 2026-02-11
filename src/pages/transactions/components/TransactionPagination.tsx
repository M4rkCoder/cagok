import React from "react";
import { Table as ReactTableType } from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionWithCategory } from "@/types";

interface TransactionPaginationProps {
  table: ReactTableType<TransactionWithCategory>;
}

const TransactionPagination: React.FC<TransactionPaginationProps> = ({
  table,
}) => {
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;

  // 10개 단위로 그룹화하기 위한 계산
  const pageGroupSize = 10;
  const currentGroup = Math.floor(currentPage / pageGroupSize);
  const startPage = currentGroup * pageGroupSize;
  const endPage = Math.min(startPage + pageGroupSize, totalPages);

  const pages = [];
  for (let i = startPage; i < endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="grid grid-cols-3 items-center px-2 py-4 w-full">
      {/* 왼쪽: 셀렉터 */}
      <div className="flex items-center gap-2 text-sm text-slate-500 justify-self-start">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[90px] bg-white">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 15, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} 행
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 중앙: 페이지네이션 */}
      <div className="justify-self-center">
        <Pagination>
          <PaginationContent>
            {/* 이전 버튼 */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={
                  !table.getCanPreviousPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* 이전 그룹 '...' */}
            {startPage > 0 && (
              <PaginationItem>
                <PaginationEllipsis
                  className="cursor-pointer"
                  onClick={() => table.setPageIndex(startPage - 1)}
                />
              </PaginationItem>
            )}

            {/* 페이지 번호 */}
            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === page}
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(page);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* 다음 그룹 '...' */}
            {endPage < totalPages && (
              <PaginationItem>
                <PaginationEllipsis
                  className="cursor-pointer"
                  onClick={() => table.setPageIndex(endPage)}
                />
              </PaginationItem>
            )}

            {/* 다음 버튼 */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={
                  !table.getCanNextPage()
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* 오른쪽: 빈 공간 (균형 유지) */}
      <div className="hidden md:block" />
    </div>
  );
};

export default TransactionPagination;
