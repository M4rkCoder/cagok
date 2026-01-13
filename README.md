# 프로젝트 컨텍스트: 개인용 로컬 가계부 (Finkro)

## 1. 기술 스택 (Tech Stack)

- **Framework:** Tauri (Backend: Rust)
- **Frontend:** React (Vanilla HTML/CSS) -> tailwind css & shad/cn ui 적용 예정
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
  |remarks|TEXT|-|메모|
  |is_fixed|INTEGER|"NOT NULL DEFAULT 0"|0:변동(Variable), 1:고정(Fixed)|

- **categories(카테고리 관리)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY, AUTOINCREMENT"|카테고리 고유(자동증가) ID|
  |icon|TEXT|"NOT NULL"|이모지 아이콘(예:🍔, 💰 )|
  |name|TEXT|"UNIQUE, NOT NULL"|카테고리 이름 (예: 식비, 월급)|
  |type|INTEGER|"NOT NULL"|0: 수입, 1:지출|

- **recurring_transactions(고정지출 반복 관리)**
  | 컬럼명 | 타입 | 필수 | 기본값 | 설명 |
  | ------------------- | ----------- | -- | ------------- | ----------------------------------------- |
  | `id` | INTEGER | O | AUTOINCREMENT | 반복 거래 고유 ID |
  | `description` | TEXT | O | - | 거래 설명 (예: 월세, 넷플릭스 구독) |
  | `amount` | REAL | O | - | 거래 금액 |
  | `category_id` | INTEGER | X | NULL | 카테고리 ID (`categories.id` 참조) |
  | `frequency` | INTEGER | O | - | 반복 주기 (daily / weekly / monthly / yearly) |
  | `start_date` | TEXT | O | - | 반복 거래 시작일 |
  | `end_date` | TEXT | X | NULL | 반복 거래 종료일 (NULL이면 무제한) |
  | `day_of_month` | INTEGER | X | NULL | 매월 반복 시 실행 날짜 (1~31) |
  | `day_of_week` | INTEGER | X | NULL | 매주 반복 시 요일 (0=일요일 ~ 6=토요일) |
  | `is_active` | INTEGER | O | 1 | 활성화 여부 (1=활성, 0=비활성) |
  | `last_created_date` | TEXT | X | NULL | 마지막으로 실제 거래가 생성된 날짜 |
  | `remarks` | TEXT | X | NULL | 비고 메모 |
  | `created_at` | TEXT | O | - | 반복 거래 생성일 |
  | `category_id (FK)` | FOREIGN KEY | - | - | `categories(id)` 참조, 삭제 시 NULL 처리 |

## 4. 화면 구성

- 홈(Dashboard): 월별 일별 통계 누적 합계 등 표기
- 가계부(Transaction): 수입 지출 내역 표기
- 설정(Setting):
  - 카테고리 설정
  - 언어 설정
  - db 백업, 동기화, csv다운로드/업로드
  - 고정지출 설정

## 5. 현재 개발 상황 (Current Status)

- **백엔드 (Rust):**
  - Tauri 프로젝트 초기 설정 및 의존성 설치 완료.
  - SQLite 데이터베이스 초기화 및 `categories`, `transactions` 테이블 생성 로직 구현 완료.
  - `categories` 및 `transactions` 테이블에 대한 CRUD (생성, 조회, 수정, 삭제) Tauri 명령 구현 완료.
  - db(init, repository), commands 구조 분리 완료. dashboard services 추가
  - 대시보드 통계를 위한 월별 카테고리 지출합계, 일별 지출 합계 등 services 추가
- **프론트엔드 (React):**
  - 바닐라 React 기반으로 UI 구현.
  - `CategoriesPage`: 카테고리 CRUD 기능 및 UI 구현 완료.
  - `TransactionsPage`: 트랜잭션 CRUD 기능 및 UI 구현 완료.
  - `DashboardPage`: 지출수입요약, 카테고리별 지출, 월별일별지출 기능 구현 완료
  - `DashboardPage`: 컴포넌트 분리(진행중), 차트 클릭시 일별 지출 내역 Dialog 팝업, 카테고리별 지출내역 팝업(진행중)

## 6. 향후 개발 계획 (Roadmap)

1.  **UI/UX 개선:** Tailwind CSS/shadcn/ui 적용
2.  **다크모드 구현:** 토글 버튼으로 다크/라이트 모드 변경 기능 구현 (프론트엔드 전환으로 인해 재검토 필요)
3.  **데이터 동기화:** 구글 인증(OAuth) 연동을 통한 SQLite DB 파일 클라우드 동기화 기능
4.  **다국어 기능 추가:** 기본 언어 영어로 하고 한글 등 기타 언어 변경 가능하도록 기능 설정 (프론트엔드 전환으로 인해 재검토 필요)
5.  **DB관리 기능 추가:** db 백업/동기화(구글 연동), csv파일로 내려받기/업로드
6.  **고정 반복지출 관리 기능추가:** 고정 반복지출 자동 입력 기능/관리 기능 (완료)
7.  **자산 관리 모듈:** 자산 관리 전용 DB 테이블 구축 및 전용 관리 페이지 추가
8.  **예산 관리 모듈:** 예산 관리 전용 DB 테이블 구축 및 전용 관리 페이지 추가

## 7. 코딩 가이드라인 (Constraints & Style)

- **Icon System:** 카테고리 아이콘은 **이모지(Emoji)**를 사용함. icon 컬럼에 이모지 입력 향후 shadcn-iconpicker 사용
- **Type Safety:** TypeScript 인터페이스를 정의하여 프론트엔드와 백엔드 간 데이터 구조 일치시킬 것.
- **Rust-TS 통신:** Tauri의 `invoke` 함수를 사용하여 DB 명령을 처리하고, 에러 핸들링을 철저히 할 것.
- **데이터 구조:** 수입/지출 내역과 자산 내역 간의 관계형 DB 정규화 유지.

---

_이 파일은 Gemini CLI의 시스템 컨텍스트로 사용됩니다. 답변 시 위 내용을 항상 참고해 주세요._
