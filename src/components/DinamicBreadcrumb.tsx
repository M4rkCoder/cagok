import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// 경로 이름을 보기 좋게 매핑 (선택 사항)
const routeLabels: Record<string, string> = {
  "": "Home",
  dashboard: "대시보드",
  transactions: "가계부",
  settings: "설정",
};

export function DynamicBreadcrumb() {
  const location = useLocation();

  // pathname 예: "/transactions/history" -> ["", "transactions", "history"]
  // filter를 써서 빈 값을 제거할 수도 있지만, 첫 번째 요소를 Home으로 쓰기 위해 가공합니다.
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathnames.map((value, index) => {
          // 순차적으로 경로 생성 (예: /transactions, /transactions/history)
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const label =
            routeLabels[value] ||
            value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <React.Fragment key={to}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {last ? (
                  // 현재 페이지 (링크 없음)
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  // 중간 단계 (Link 컴포넌트 사용)
                  <BreadcrumbLink asChild>
                    <Link to={to}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
