// hooks/useTableNavigation.ts
export const useTableNavigation = (
  table: any,
  setActiveCell: (cell: { rowIndex: number; colIdx: number } | null) => void
) => {
  const moveNext = (r: number, c: number, closeAction?: () => void) => {
    if (closeAction) closeAction(); // 팝업 닫기 등 후속 작업
    setActiveCell({ rowIndex: r, colIdx: c });
  };

  const handleTableKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    colIdx: number,
    columnId: string,
    rowType: number, // row.original.type (수입/지출 구분용)
    closeAction?: () => void,
    isPopupOpen?: boolean
  ) => {
    const maxRows = table.getRowModel().rows.length;
    const maxCols = 6; // date, category, fixed, description, amount, remarks

    // 1. 카테고리 셀이고 팝업이 열려있을 때의 엔터키 처리
    if (columnId === "category_id" && isPopupOpen) {
      if (e.key === "Enter") {
        // 엔터키가 CommandItem의 onSelect을 트리거하도록 훅에서의 처리를 건너뜁니다.
        // e.preventDefault()를 호출하지 않음으로써 Command 컴포넌트가 이벤트를 가져가게 합니다.
        return;
      }
    }

    // 화살표/엔터/탭 로직 공통화
    switch (e.key) {
      case "Tab":
        e.preventDefault();
        if (columnId === "category_id") {
          // category_id 열에서
          if (e.shiftKey) moveNext(rowIndex, 1);
          else moveNext(rowIndex, rowType === 1 ? 3 : 4); // 수입(0)이면 '고정' 점프
        } else if (e.shiftKey) {
          const prevCol = colIdx === 1 ? maxCols : colIdx - 1;
          const prevRow = colIdx === 1 ? Math.max(0, rowIndex - 1) : rowIndex;
          moveNext(prevRow, prevCol);
        } else {
          const nextCol = colIdx === maxCols ? 1 : colIdx + 1;
          const nextRow =
            colIdx === maxCols ? Math.min(maxRows - 1, rowIndex + 1) : rowIndex;
          moveNext(nextRow, nextCol);
        }
        break;

      case "Enter":
        e.preventDefault();
        moveNext(Math.min(maxRows - 1, rowIndex + 1), 1);
        break;

      case "ArrowUp":
      case "ArrowDown":
        // 팝업이 열려있을 때는 위아래 방향키를 CommandList 이동에 양보
        if (columnId === "category_id" && isPopupOpen) return;

        e.preventDefault();
        if (e.key === "ArrowUp") moveNext(Math.max(0, rowIndex - 1), colIdx);
        else moveNext(Math.min(maxRows - 1, rowIndex + 1), colIdx);
        break;

      case "ArrowLeft":
        if (columnId !== "category_id") {
          e.preventDefault();
          moveNext(rowIndex, Math.max(1, colIdx - 1));
        }
        break;
      case "ArrowRight":
        if (columnId !== "category_id") {
          e.preventDefault();
          moveNext(rowIndex, Math.min(maxCols, colIdx + 1));
        }
        break;
    }
  };

  return { handleTableKeyDown, moveNext };
};
