export interface Category {
  id: number;
  name: string;
  icon: string;
  type: 0 | 1; // 0: income, 1: expense
}
