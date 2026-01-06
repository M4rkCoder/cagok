# 프로젝트 컨텍스트: 개인용 로컬 가계부 (Finkro)

## 1. 기술 스택 (Tech Stack)

- **Framework:** Tauri (Backend: Rust)
- **Frontend:** React (Vanilla HTML/CSS)
- **Database:** SQLite (로컬 저장소)

## 2. 프로젝트 목표 및 핵심 기능

- 개인용 로컬 가계부 애플리케이션 개발
- 수입/지출 내역 관리
- 카테고리별 내역 분류

## 3. 데이터베이스 구조

- **transactions(거래 내역)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY, AUTOINCREMENT"|거래 고유 ID(자동증가)|
  |description|TEXT|-|거래 상세 내용|
  |amount|REAL|"NOT NULL"|금액 (실수형)|
  |date|TEXT|"NOT NULL"|거래 날짜 (YYYY-MM-DD)|
  |type|INTEGER|"NOT NULL"|0:수입, 1지출|
  |category_id|INTEGER|FOREIGN KEY|categories(id) 참조|
  |is_fixed|INTEGER|"NOT NULL DEFAULT 0"|0:변동(Variable), 1:고정(Fixed)|

- **categories(카테고리 관리)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY, AUTOINCREMENT"|카테고리 고유(자동증가) ID|
  |icon|TEXT|"NOT NULL"|이모지 아이콘(예:🍔, 💰 )|
  |name|TEXT|"UNIQUE, NOT NULL"|카테고리 이름 (예: 식비, 월급)|
  |type|INTEGER|"NOT NULL"|0: 수입, 1:지출|

## 4. 현재 개발 상황 (Current Status)

- **백엔드 (Rust):**
  - Tauri 프로젝트 초기 설정 및 의존성 설치 완료.
  - SQLite 데이터베이스 초기화 및 `categories`, `transactions` 테이블 생성 로직 구현 완료.
  - `categories` 및 `transactions` 테이블에 대한 CRUD (생성, 조회, 수정, 삭제) Tauri 명령 구현 완료.
- **프론트엔드 (React):**
  - 바닐라 React 기반으로 UI 구현. (Tailwind CSS 및 shadcn/ui 통합 문제로 전환)
  - `CategoriesPage` 및 `TransactionsPage` 간의 기본 내비게이션 구현.
  - `CategoriesPage`: 카테고리 CRUD 기능 및 UI 구현 완료.
  - `TransactionsPage`: 트랜잭션 CRUD 기능 및 UI 구현 완료.
  - `TransactionsPage`의 트랜잭션 저장 시 `is_fixed` 필드 관련 오류 해결 완료.
  - `TransactionsPage`의 트랜잭션 저장 시 `category_id` 필드가 `NULL`로 저장되는 문제 발생. 현재 디버깅 중.

## 5. 향후 개발 계획 (Roadmap)

1.  **`TransactionsPage` `category_id` NULL 저장 버그 해결:** 현재 발생 중인 `category_id` NULL 저장 문제를 해결해야 함.
2.  **자산 관리 모듈:** 자산 관리 전용 DB 테이블 구축 및 전용 관리 페이지 추가
3.  **다크모드 구현:** 토글 버튼으로 다크/라이트 모드 변경 기능 구현 (프론트엔드 전환으로 인해 재검토 필요)
4.  **데이터 동기화:** 구글 인증(OAuth) 연동을 통한 SQLite DB 파일 클라우드 동기화 기능
5.  **다국어 기능 추가:** 기본 언어 영어로 하고 한글 등 기타 언어 변경 가능하도록 기능 설정 (프론트엔드 전환으로 인해 재검토 필요)
6.  **UI/UX 개선:** 바닐라 HTML/CSS로 구현된 UI를 개선하고 디자인을 적용. (현재 Tailwind CSS/shadcn/ui 통합 문제로 보류)

## 6. 코딩 가이드라인 (Constraints & Style)

- **Icon System:** 카테고리 아이콘은 **이모지(Emoji)**를 사용함. icon 컬럼에 이모지 입력
- **Type Safety:** TypeScript 인터페이스를 정의하여 프론트엔드와 백엔드 간 데이터 구조 일치시킬 것.
- **Rust-TS 통신:** Tauri의 `invoke` 함수를 사용하여 DB 명령을 처리하고, 에러 핸들링을 철저히 할 것.
- **데이터 구조:** 수입/지출 내역과 자산 내역 간의 관계형 DB 정규화 유지.

---

_이 파일은 Gemini CLI의 시스템 컨텍스트로 사용됩니다. 답변 시 위 내용을 항상 참고해 주세요._
