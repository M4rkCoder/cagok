# 프로젝트 컨텍스트: 개인용 로컬 가계부 (C`AGOK)

## 1. 기술 스택 (Tech Stack)

- **Framework:** Tauri (Backend: Rust)
- **Frontend:** React (tailwind css & shad/cn ui)
- **Database:** SQLite (로컬 저장소)

## 2. 프로젝트 목표 및 핵심 기능

- 개인용 로컬 가계부 애플리케이션 개발
- 수입/지출 내역 관리
- 월간/연간 통계 조회
- 카테고리별 내역 분류
- 대량 입력, 반복 입력, 클라우드 동기화 기능(PRO 기능)

## 3. 데이터베이스 구조

- **app_settings(애플리케이션 설정)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |key|TEXT|"PRIMARY KEY"|설정 키|
  |value|TEXT|"NOT NULL"|설정 값|

- **accounts(자산 계좌)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY AUTOINCREMENT"|계좌 고유 ID(자동증가)|
  |name|TEXT|"NOT NULL UNIQUE"|계좌 이름 (예: 현금, 우리은행)|
  |icon|TEXT|"NOT NULL"|이모지 아이콘 (예: 💰, 💳)|
  |type|INTEGER|"NOT NULL"|0: 현금, 1: 은행(체크/저축), 2: 신용카드, 3: 투자|

- **categories(카테고리 관리)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY AUTOINCREMENT"|카테고리 고유(자동증가) ID|
  |name|TEXT|"UNIQUE, NOT NULL"|카테고리 이름 (예: 식비, 월급)|
  |icon|TEXT|"NOT NULL"|이모지 아이콘(예:🍔, 💰 )|
  |type|INTEGER|"NOT NULL"|0: 수입, 1:지출|

- **transactions(거래 내역)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY AUTOINCREMENT"|거래 고유 ID(자동증가)|
  |description|TEXT|-|거래 상세 내용|
  |amount|REAL|"NOT NULL"|금액 (실수형)|
  |date|TEXT|"NOT NULL"|거래 날짜 (YYYY-MM-DD)|
  |type|INTEGER|"NOT NULL"|0:수입, 1:지출|
  |is_fixed|INTEGER|"NOT NULL DEFAULT 0"|0:변동(Variable), 1:고정(Fixed)|
  |remarks|TEXT|-|메모|
  |category_id|INTEGER|FOREIGN KEY|categories(id) 참조 (삭제 시 NULL 처리)|
  |account_id|INTEGER|"DEFAULT 1, FOREIGN KEY"|accounts(id) 참조|

- **goals(목표 관리)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY AUTOINCREMENT"|목표 고유 ID|
  |name|TEXT|"NOT NULL"|목표 이름 (월별 중복 허용)|
  |target_amount|REAL|"NOT NULL"|목표 금액|
  |current_amount|REAL|"DEFAULT 0"|현재 달성 금액|
  |target_month|TEXT|"NOT NULL"|목표 월 (YYYY-MM)|
  |category_id|INTEGER|FOREIGN KEY|categories(id) 참조 (선택 사항, 삭제 시 NULL 처리)|
  |status|INTEGER|"DEFAULT 0"|0: 진행중, 1: 달성, 2: 삭제/숨김|
  |parent_goal_id|INTEGER|FOREIGN KEY|이전 달에서 복사된 경우 원본 ID (삭제 시 NULL 처리)|
  |created_at|TEXT|"NOT NULL"|목표 생성일|

- **recurring_transactions(반복 거래 관리)**
  |컬럼명|타입|제약 조건|설명|
  |---|---|---|---|
  |id|INTEGER|"PRIMARY KEY AUTOINCREMENT"|반복 거래 고유 ID|
  |description|TEXT|"NOT NULL"|거래 설명|
  |amount|REAL|"NOT NULL"|거래 금액|
  |category_id|INTEGER|FOREIGN KEY|categories(id) 참조 (삭제 시 NULL 처리)|
  |account_id|INTEGER|"DEFAULT 1, FOREIGN KEY"|accounts(id) 참조 (삭제 시 NULL 처리)|
  |frequency|INTEGER|"NOT NULL"|반복 주기 (0: 일별, 1: 주별, 2: 월별, 3: 년별)|
  |start_date|TEXT|"NOT NULL"|반복 시작일 (YYYY-MM-DD)|
  |end_date|TEXT|-|반복 종료일 (NULL이면 무제한)|
  |day_of_month|INTEGER|-|매월 반복 시 실행 날짜 (1~31)|
  |day_of_week|INTEGER|-|매주 반복 시 요일 (0=일요일 ~ 6=토요일)|
  |is_active|INTEGER|"NOT NULL DEFAULT 1"|활성화 여부 (1=활성, 0=비활성)|
  |last_created_date|TEXT|-|마지막으로 실제 거래가 생성된 날짜 (YYYY-MM-DD)|
  |remarks|TEXT|-|비고 메모|
  |created_at|TEXT|"NOT NULL"|반복 거래 생성일|

## 4. 화면 구성

- 홈(Dashboard): 월별 일별 통계 누적 합계 등 표기
- 가계부(Transaction): 수입 지출 내역 표기 (3가지 뷰모드: 타임라인, 캘린더, 테이블)
  - 빠른 입력 기능(테이블 형태 대량 입력기능, 엑셀 업로드) / PRO 기능
  - 반복 입력 기능(정기 수입 지출 내역 자동 입력 기능) / PRO 기능
- 통계(Statistics): 연단위 통계 표시
- 설정(Setting):
  - 기본 앱 설정 (가계부 이름, 언어, 통화, 가계부 내역 보기)
  - 카테고리 설정
  - db 백업, csv파일 다운로드
  - MS OneDrive 동기화 기능 / PRO 기능

## 5. 향후 개발 계획 (Roadmap)

1.  **Error Handling(상시):** 실 사용하면서 사용자가 경험할수 있는 에러로 인해 앱이 크래시나는 경우 없도록 Error handling
2.  **INVOKE함수를 FE에서 별도 API훅으로 총괄 관리**
3.  **다국어 기능 추가:** 기본 언어 영어로 하고 한글 등 기타 언어 변경 가능하도록 기능 설정
4.  **MS Store 업로드 및 PRO 인앱구매 기능 추가:** MS에 업로드하고 인앱구매 기능으로 구매자만 해당 메뉴에 접근할 수 있도록 설정
5.  **(장기) 예산 관리(Goal 테이블) 기능 추가**
6.  **(장기) 결제수단 관리 기능 추가**

## 6. 코딩 가이드라인 (Constraints & Style)

- **Icon System:** 카테고리 아이콘은 **이모지(Emoji)**를 사용함.
- **Type Safety:** TypeScript 인터페이스를 정의하여 프론트엔드와 백엔드 간 데이터 구조 일치시킬 것.
- **Rust-TS 통신:** Tauri의 `invoke` 함수를 사용하여 DB 명령을 처리하고 zustand Store기능으로 상태 및 함수를 관리할것
  - **API 함수 스펙:** [API_SPEC.md 참고](API_SPEC.md)
  - **API 리턴 타입:** [API_TYPES.md 참고](API_TYPES.md)

  **Rust 관련 반드시 숙지할 사항**
  - 백엔드는 레포지토리/서비스/커맨드 3개 레이어 구조로 관리중 (계산이 간단할시 서비스 레이어는 생략 가능)
    (1. db/repository.rs에 레포지토리 2. services 폴더에 서비스 레이어 3. commands 폴더에 command 레이어)
  - Tauri v2 사용중. 문법 사용에 유의할것!!!
  - permission은 capabilities/window.json에 설정됨
  - Db connection은 src-tauri/db/mod.rs 에 `pub struct DbConnection(pub Mutex<Connection>);`로 사용

---

_이 파일은 Gemini CLI의 시스템 컨텍스트로 사용됩니다. 답변 시 위 내용을 항상 참고해 주세요._
