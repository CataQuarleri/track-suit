import { Button, Input, Card } from './shared/ui';
import './App.css';

function App() {
  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
      <header>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-2)' }}>TrackSuit</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Component Scaffolding Demo</p>
      </header>

      <section>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>Buttons</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>Inputs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Input label="Email Address" placeholder="Enter your email" type="email" />
          <Input label="Password" placeholder="Enter your password" type="password" error="Password must be at least 8 characters" />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>Cards</h2>
        <Card padding="lg">
          <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-2)' }}>Reconciliation Ready</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-4)' }}>
            You have 3 un-reconciled transactions waiting to be bundled.
          </p>
          <Button fullWidth>Start Reconciliation</Button>
        </Card>
      </section>
    </div>
  );
}

export default App;
