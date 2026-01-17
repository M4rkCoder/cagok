// DB에서 조회되는 트랜잭션
export interface Transaction {
  id: number;
  description?: string;
  amount: number;
  date: string;
  type: number; // 0: income, 1: expense
  remarks: string;
  is_fixed: number; // 0: variable, 1: fixed
  category_id?: number;
}

// 생성용 (id 없음)
export type CreateTransaction = Omit<Transaction, "id">;

// 수정용 (일부만 바꿀 수 있음)
export type UpdateTransaction = Partial<CreateTransaction> & {
  id: number;
};

//카테고리 통합 조회 용
export interface TransactionWithCategory extends Transaction {
  category_name?: string;
  category_icon?: string;
}
