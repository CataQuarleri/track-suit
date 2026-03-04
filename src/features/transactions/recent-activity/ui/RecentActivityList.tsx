import React, { useEffect, useState } from 'react';
import { useFamily } from '@/app/providers/FamilyProvider';
import { Card } from '@/shared/ui';
import { getRecentTransactions } from '@/entities/transaction/api/transaction-api';
import { Transaction } from '@/entities/transaction/model/types';

export const RecentActivityList: React.FC = () => {
  const { user } = useFamily();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await getRecentTransactions(10);
    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  if (loading) return <p>Loading activity...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Recent Activity</h3>
      {transactions.length === 0 ? (
        <p style={{ color: 'var(--color-text-tertiary)' }}>No transactions yet.</p>
      ) : (
        transactions.map((t) => (
          <Card key={t.id} padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontWeight: '600' }}>{t.category || 'Uncategorized'}</p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  {new Date(t.date).toLocaleDateString()} • {t.privacy}
                </p>
                {t.notes && <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>{t.notes}</p>}
              </div>
              <p style={{ fontWeight: '700', color: t.amount < 0 ? 'var(--color-danger-main)' : 'var(--color-text-primary)' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.amount)}
              </p>
            </div>
          </Card>
        ))
      )}
      <Button variant="ghost" onClick={fetchTransactions} size="sm">Refresh Activity</Button>
    </div>
  );
};

// Internal Button import for simplicity in this feature file
import { Button } from '@/shared/ui';
