export type TransactionPrivacy = 'shared' | 'private';

export interface Transaction {
  id: string;
  family_id: string;
  member_id: string;
  account_id: string | null;
  budget_id: string | null;
  amount: number;
  date: string;
  category: string | null;
  privacy: TransactionPrivacy;
  notes: string | null;
  created_at: string;
}

export interface TransactionCreate {
  amount: number;
  date: string;
  category?: string;
  privacy: TransactionPrivacy;
  notes?: string;
  account_id?: string;
  budget_id?: string;
}
