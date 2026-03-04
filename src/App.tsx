import { useFamily } from '@/app/providers/FamilyProvider'
import { Button } from '@/shared/ui'
import { LogTransactionForm } from '@/features/transactions/log-transaction/ui/LogTransactionForm'
import { RecentActivityList } from '@/features/transactions/recent-activity/ui/RecentActivityList'
import './App.css'

function App() {
  const { user, family, member, loading } = useFamily();

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading TrackSuit...</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: 'var(--spacing-6)', maxWidth: '600px', margin: '0 auto' }}>
      {!user ? (
        <div className="auth-section">
          <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-primary-main)' }}>TrackSuit</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Event Sourcing Core Active</p>
          </header>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 'var(--spacing-4)' }}>Phase 3: Ledger Foundation</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              Login to access the immutable transaction ledger.
            </p>
          </div>
        </div>
      ) : (
        <div className="dashboard-section">
          <header style={{ marginBottom: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Hi, {member?.name || user.email}!</h1>
              {family && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Family: <strong>{family.name}</strong>
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Sync</Button>
          </header>

          <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <section>
              <LogTransactionForm />
            </section>
            
            <section>
              <RecentActivityList />
            </section>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
