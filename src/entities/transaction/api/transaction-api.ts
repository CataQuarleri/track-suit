import { supabase } from '@/shared/api/supabase';
import { Transaction, TransactionCreate } from '../model/types';

export const logTransaction = async (
  transaction: TransactionCreate, 
  familyId: string, 
  memberId: string
): Promise<{ data: Transaction | null; error: any }> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        ...transaction,
        family_id: familyId,
        member_id: memberId,
      },
    ])
    .select()
    .single();

  return { data: data as Transaction | null, error };
};

export const getRecentTransactions = async (limit = 10): Promise<{ data: Transaction[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data as Transaction[] | null, error };
};
