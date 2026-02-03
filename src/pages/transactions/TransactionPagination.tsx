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
import { TransactionWithCategory } from "@/types";

interface TransactionPaginationProps {
  table: ReactTableType<TransactionWithCategory>;
}

const TransactionPagination: React.FC<TransactionPaginationProps> = ({
  table,
}) => {
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();

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
    <Pagination className="py-4">
      <PaginationContent>
        {/* 이전 버튼: 현재 페이지가 첫 페이지면 비활성화 */}
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

        {/* 이전 그룹으로 이동하는 '...' (첫 번째 그룹이 아닐 때만 노출) */}
        {startPage > 0 && (
          <PaginationItem>
            <PaginationEllipsis
              className="cursor-pointer"
              onClick={() => table.setPageIndex(startPage - 1)}
            />
          </PaginationItem>
        )}

        {/* 현재 그룹의 페이지 번호들 (최대 10개) */}
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

        {/* 다음 그룹으로 이동하는 '...' (마지막 그룹이 아닐 때만 노출) */}
        {endPage < totalPages && (
          <PaginationItem>
            <PaginationEllipsis
              className="cursor-pointer"
              onClick={() => table.setPageIndex(endPage)}
            />
          </PaginationItem>
        )}

        {/* 다음 버튼: 현재 페이지가 마지막 페이지면 비활성화 */}
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
  );
};

export default TransactionPagination;
