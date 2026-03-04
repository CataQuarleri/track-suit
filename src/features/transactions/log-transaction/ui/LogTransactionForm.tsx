import React, { useState } from 'react';
import { useFamily } from '@/app/providers/FamilyProvider';
import { Button, Input, Card } from '@/shared/ui';
import { logTransaction } from '@/entities/transaction/api/transaction-api';
import { TransactionPrivacy } from '@/entities/transaction/model/types';

export const LogTransactionForm: React.FC = () => {
  const { family, member } = useFamily();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [privacy, setPrivacy] = useState<TransactionPrivacy>('shared');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !member) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: logError } = await logTransaction(
        {
          amount: parseFloat(amount),
          date,
          category,
          notes,
          privacy,
        },
        family.id,
        member.id
      );

      if (logError) throw logError;

      setSuccess(true);
      setAmount('');
      setCategory('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to log transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>Log Transaction</h3>
        
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Input
          label="Category"
          placeholder="e.g., Groceries, Rent"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Input
          label="Notes"
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
          <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Privacy:</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <button
              type="button"
              onClick={() => setPrivacy('shared')}
              style={{
                padding: 'var(--spacing-1) var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: privacy === 'shared' ? 'var(--color-primary-main)' : 'transparent',
                color: privacy === 'shared' ? 'white' : 'inherit',
                cursor: 'pointer'
              }}
            >
              Shared
            </button>
            <button
              type="button"
              onClick={() => setPrivacy('private')}
              style={{
                padding: 'var(--spacing-1) var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: privacy === 'private' ? 'var(--color-primary-main)' : 'transparent',
                color: privacy === 'private' ? 'white' : 'inherit',
                cursor: 'pointer'
              }}
            >
              Private
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'var(--color-danger-main)', fontSize: 'var(--font-size-sm)' }}>{error}</p>}
        {success && <p style={{ color: 'var(--color-success-main)', fontSize: 'var(--font-size-sm)' }}>Transaction logged successfully!</p>}

        <Button type="submit" loading={loading} fullWidth>
          Log Transaction
        </Button>
      </form>
    </Card>
  );
};
