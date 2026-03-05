use crate::db::repository::TransactionRepository;
use crate::db::{DbConnection, Transaction, TransactionWithCategory, DailySummary, MonthlyTotalSummary, TransactionFilters, ExcelPreviewRow};
use crate::commands::category::fetch_categories_logic;
use tauri::State;
use calamine::{open_workbook_auto, Reader};
use rust_xlsxwriter::{Workbook, Format, Color, DataValidation, FormatBorder, ExcelDateTime, Formula};
use chrono::Datelike;

#[tauri::command]
pub fn create_transaction(
    transaction: Transaction,
    db: State<'_, DbConnection>,
) -> Result<i64, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::create(&conn, transaction).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transactions(db: State<'_, DbConnection>) -> Result<Vec<Transaction>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_all(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transactions_with_category(
    db: State<'_, DbConnection>,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_all_with_category(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_transaction(
    id: i64,
    transaction: Transaction,
    db: State<'_, DbConnection>,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::update(&conn, id, transaction).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_transaction(id: i64, db: State<'_, DbConnection>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::delete(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_bulk_transactions(
    ids: Vec<i64>, 
    db: State<'_, DbConnection>
) -> Result<usize, String> { 
    let conn = db.0.lock().unwrap();

    TransactionRepository::delete_bulk(&conn, ids.clone())
        .map_err(|e| e.to_string())?; 

    Ok(ids.len())
}

#[tauri::command]
pub fn get_transactions_by_date(
    db: State<'_, DbConnection>,
    date: String,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_by_date_with_category(&conn, &date)
        .map_err(|e| format!("Failed to get transactions by date: {}", e))
}

#[tauri::command]
pub fn get_all_daily_summaries(
    db: State<'_, DbConnection>,
) -> Result<Vec<DailySummary>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_daily_summaries_all_time(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_monthly_total_trends(
    db: State<'_, DbConnection>,
) -> Result<Vec<MonthlyTotalSummary>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_monthly_total_trends_all_time(&conn)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_transactions_by_month_and_category(
    db: State<'_, DbConnection>,
    year_month: String,
    category_id: i64,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    TransactionRepository::get_by_month_and_category(&conn, &year_month, category_id)
        .map_err(|e| format!("Failed to get transactions: {}", e))
}

#[tauri::command]
pub fn get_filtered_transactions_command(
    db: State<'_, DbConnection>, // DB Connection이 포함된 앱 상태
    filters: TransactionFilters,
) -> Result<Vec<TransactionWithCategory>, String> {
    let conn = db.0.lock().unwrap();
    
    // 레포지토리 함수 호출
    TransactionRepository::get_filtered_transactions(&conn, filters)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn parse_transaction_file(
    db: State<'_, DbConnection>, 
    path: String
) -> Result<Vec<ExcelPreviewRow>, String> {
    let categories = fetch_categories_logic(db)?;

    let mut workbook = open_workbook_auto(&path)
        .map_err(|e| format!("파일을 열 수 없습니다: {}", e))?;

    let range = workbook
        .worksheet_range_at(0)
        .ok_or("시트를 찾을 수 없습니다.")?
        .map_err(|e| e.to_string())?;

    let rows = range.rows().collect::<Vec<_>>();
    if rows.is_empty() { return Ok(Vec::new()); }

    let headers = rows[0];
    let get_idx = |names: &[&str]| -> Option<usize> {
        headers.iter().position(|cell| {
            let s = cell.to_string().to_lowercase();
            names.iter().any(|&name| s.contains(name))
        })
    };

    let idx_date = get_idx(&["date", "날짜"]);
    let idx_combined = get_idx(&["category", "카테고리", "항목", "유형"]); 
    let idx_amt = get_idx(&["amount", "금액"]);
    let idx_fixed = get_idx(&["fixed", "고정비", "고정여부"]);
    let idx_desc = get_idx(&["description", "내용", "내역"]);
    let idx_memo = get_idx(&["remarks", "메모", "비고"]);

    let mut result = Vec::new();

    for row in rows.into_iter().skip(1) {
        let mut error_msg = None;
        let mut is_valid = true;

        // 일반 텍스트용 도우미
        let get_val = |idx: Option<usize>| -> String {
            idx.and_then(|i| row.get(i)).map(|c| c.to_string().trim().to_string()).unwrap_or_default()
        };
        let parsed_date = idx_date.and_then(|i| row.get(i)).map(|cell| {
            let raw_val = cell.to_string().trim().replace("-", "").replace(".", "").replace("/", "");
            
            if let Ok(num) = raw_val.parse::<i64>() {
                // 현재 연도 가져오기 (예: 2026)
                let current_year = chrono::Local::now().year();
        
                // (A) 4자리 숫자 (예: 0213 -> 2026-02-13)
                if raw_val.len() == 4 {
                    let m = (num / 100) as u32;
                    let d = (num % 100) as u32;
                    if let Some(date) = chrono::NaiveDate::from_ymd_opt(current_year, m, d) {
                        return date.format("%Y-%m-%d").to_string();
                    }
                }
                // (B) 엑셀 일련번호 (5자리 이하)
                else if raw_val.len() == 5 {
                    let base_date = chrono::NaiveDate::from_ymd_opt(1899, 12, 30).unwrap();
                    if let Some(final_date) = base_date.checked_add_signed(chrono::Duration::days(num)) {
                        return final_date.format("%Y-%m-%d").to_string();
                    }
                } 
                // (C) 6자리 숫자 (예: 260213 -> 2026-02-13)
                else if raw_val.len() == 6 {
                    let y = 2000 + (num / 10000) as i32;
                    let m = ((num % 10000) / 100) as u32;
                    let d = (num % 100) as u32;
                    if let Some(date) = chrono::NaiveDate::from_ymd_opt(y, m, d) {
                        return date.format("%Y-%m-%d").to_string();
                    }
                }
                // (D) 8자리 숫자 (예: 20260213)
                else if raw_val.len() == 8 {
                    let y = (num / 10000) as i32;
                    let m = ((num % 10000) / 100) as u32;
                    let d = (num % 100) as u32;
                    if let Some(date) = chrono::NaiveDate::from_ymd_opt(y, m, d) {
                        return date.format("%Y-%m-%d").to_string();
                    }
                }
            }
            cell.to_string().trim().to_string()
        }).unwrap_or_default();
 
        // --- 카테고리 로직 (카테고리 / 유형 구조) ---
        let combined_val = get_val(idx_combined);
        let mut tx_type = 1;
        let mut cat_id = "".to_string();
        let mut cat_display = "".to_string();

        if !combined_val.is_empty() {
            let parts: Vec<&str> = combined_val.split('/').collect();
            let target_cat_name = parts[0].trim();

            if let Some(c) = categories.iter().find(|c| c.name == target_cat_name) {
                cat_id = c.id.unwrap_or(0).to_string();
                cat_display = c.name.clone();
                tx_type = c.r#type as i32;
            } else {
                is_valid = false;
                cat_display = target_cat_name.to_string();
                error_msg = Some(format!("존재하지 않는 카테고리: {}", target_cat_name));
            }
        }

        let amount = get_val(idx_amt).replace(",", "");
        let raw_fixed = get_val(idx_fixed).to_lowercase();
        let is_fixed = if ["true", "t", "1", "yes", "예", "y", "고정", "고정비", "fix", "fixed"]
            .contains(&raw_fixed.as_str()) { 1 } else { 0 };

        result.push(ExcelPreviewRow {
            id: uuid::Uuid::new_v4().to_string(),
            date: parsed_date, // 확실하게 변환된 날짜 문자열 주입
            tx_type,
            category_id: cat_id,
            category_name: cat_display,
            is_fixed,
            description: get_val(idx_desc),
            amount,
            remarks: get_val(idx_memo),
            is_valid,
            error_msg,
        });
    }

    Ok(result)
}

#[tauri::command]
pub async fn generate_excel_template(
    db: State<'_, DbConnection>,
    file_path: String,
    lang: String,
) -> Result<(), String> {
    // 1. DB에서 카테고리 구조체 리스트 가져오기
    let category_list = fetch_categories_logic(db)?;

    let mut workbook = Workbook::new();

    // --- 2. 지역화 설정 ---
    let (h_date, h_combined, h_amt, h_fixed, h_desc, h_memo, s_in, s_out, s_template, s_guide) = match lang.as_str() {
        "en" => (
            "Date", "Category / Type", "Amount", "Fixed", "Description", "Remarks",
            "Income", "Expense", "Input Template", "Category Guide"
        ),
        _ => (
            "날짜", "카테고리 / 유형", "금액", "고정여부", "상세 내역", "메모",
            "수입", "지출", "내역 입력", "카테고리 가이드"
        ),
    };

    // --- 3. 드롭다운용 리스트 가공 ("카테고리 / 유형") ---
    let dropdown_items: Vec<String> = category_list.iter().map(|c| {
        let type_label = if c.r#type == 0 { s_in } else { s_out };
        format!("{} / {}", c.name, type_label)
    }).collect();

    // --- 4. 스타일 및 서식 설정 ---
    let header_format = Format::new()
        .set_bold()
        .set_background_color(Color::RGB(0xEEEEEE))
        .set_border(FormatBorder::Thin);
    
    let title_format = Format::new()
        .set_bold()
        .set_font_size(12);

    let date_format = Format::new().set_num_format("yyyy-mm-dd");
    let num_format = Format::new().set_num_format("#,##0");

    // --- 5. [시트 1] 내역 입력 ---
    let sheet1 = workbook.add_worksheet();
    sheet1.set_name(s_template).map_err(|e| e.to_string())?;

    // 헤더 작성
    let headers = [h_date, h_combined, h_amt, h_fixed, h_desc, h_memo];
    for (col, text) in headers.iter().enumerate() {
        sheet1.write_with_format(0, col as u16, *text, &header_format).map_err(|e| e.to_string())?;
    }

    // 예시 데이터 작성 (2행)
    let example_date = ExcelDateTime::from_ymd(2026, 2, 13).map_err(|e| e.to_string())?;
    sheet1.write_datetime_with_format(1, 0, &example_date, &date_format).map_err(|e| e.to_string())?;
    
    if let Some(first_item) = dropdown_items.get(0) {
        sheet1.write(1, 1, first_item).map_err(|e| e.to_string())?;
    }
    
    sheet1.write_number(1, 2, 15000.0).map_err(|e| e.to_string())?;
    sheet1.set_cell_format(1, 2, &num_format).map_err(|e| e.to_string())?;

    if !dropdown_items.is_empty() {
        let range_formula = format!("='{}'!$A$2:$A${}", s_guide, dropdown_items.len() + 1);
        let formula = Formula::new(range_formula);
        let mut cat_validation = DataValidation::new();
        cat_validation = cat_validation.allow_list_formula(formula);

        // B열(1번 컬럼) 2행(index 1)부터 1000개 행에 적용
        sheet1
            .add_data_validation(1, 1, 1000, 1, &cat_validation)
            .map_err(|e| e.to_string())?;
    }

    sheet1.set_column_width(0, 15).map_err(|e| e.to_string())?; 
    sheet1.set_column_width(1, 25).map_err(|e| e.to_string())?; 
    sheet1.set_column_width(2, 12).map_err(|e| e.to_string())?; 
    sheet1.set_column_width(5, 25).map_err(|e| e.to_string())?; 

    // --- 6. [시트 2] 카테고리 가이드 ---
    let sheet2 = workbook.add_worksheet();
    sheet2.set_name(s_guide).map_err(|e| e.to_string())?;
    
    sheet2.write_with_format(0, 0, if lang == "en" { "1. Category List" } else { "1. 카테고리 목록" }, &title_format).map_err(|e| e.to_string())?;
    
    for (i, item) in dropdown_items.iter().enumerate() {
        sheet2.write((i + 1) as u32, 0, item).map_err(|e| e.to_string())?;
    }

    // --- 고정비 가이드 추가 ---
    let col_offset = 3; 
    sheet2.write_with_format(0, col_offset, if lang == "en" { "2. Fixed Expense Format" } else { "2. 고정비 입력 가능 형식" }, &title_format).map_err(|e| e.to_string())?;
    
    let fixed_guide = if lang == "en" {
        vec![
            ("Category", "Input Examples"),
            ("Positive (Fixed)", "true, T, 1, yes, y, fixed, fix"),
            ("Negative (Variable)", "false, F, 0, no, n, (or Leave empty)"),
        ]
    } else {
        vec![
            ("구분", "입력 가능 예시"),
            ("고정비인 경우", "예, 고정, 고정비, true, T, 1, yes, y, fixed"),
            ("변동비인 경우", "아니오, false, F, 0, no, n, (또는 빈칸)"),
        ]
    };

    for (i, (label, examples)) in fixed_guide.iter().enumerate() {
        let row = (i + 1) as u32;
        sheet2.write(row, col_offset, *label).map_err(|e| e.to_string())?;
        sheet2.write(row, col_offset + 1, *examples).map_err(|e| e.to_string())?;
    }

    sheet2.set_column_width(0, 30).map_err(|e| e.to_string())?; 
    sheet2.set_column_width(col_offset, 20).map_err(|e| e.to_string())?; 
    sheet2.set_column_width(col_offset + 1, 40).map_err(|e| e.to_string())?; 

    // --- 7. 파일 저장 ---
    workbook.save(&file_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn bulk_create_transactions(
    db: State<'_, DbConnection>,
    transactions: Vec<Transaction>,
) -> Result<String, String> {
    // 1. .await을 제거하고 lock().unwrap() 혹은 에러 처리를 합니다.
    // std::sync::Mutex는 Result를 반환하므로 .map_err를 사용하여 처리합니다.
    let mut conn_lock = db.0.lock()
        .map_err(|_| "데이터베이스 잠금을 획득할 수 없습니다 (Poisoned).")?;

    // 2. 트랜잭션 시작
    // conn_lock이 MutexGuard이므로 &mut *conn_lock를 통해 Connection을 참조합니다.
    let tx = conn_lock
        .transaction()
        .map_err(|e| format!("트랜잭션 시작 실패: {}", e))?;

    {
        // 3. Statement 준비
        let mut stmt = tx
            .prepare(
                "INSERT INTO transactions (description, amount, date, type, is_fixed, remarks, category_id) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
            )
            .map_err(|e| e.to_string())?;

        // 4. 데이터 삽입
        for t in &transactions {
            stmt.execute((
                &t.description,
                t.amount,
                &t.date,
                t.r#type,
                t.is_fixed,
                &t.remarks,
                t.category_id,
            ))
            .map_err(|e| format!("데이터 삽입 오류: {}", e))?;
        }
    } // stmt 스코프 종료

    // 5. 커밋
    tx.commit().map_err(|e| format!("DB 커밋 실패: {}", e))?;

    Ok(format!("{}건 저장 완료", transactions.len()))
}