import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FamilyProvider } from '@/app/providers/FamilyProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FamilyProvider>
      <App />
    </FamilyProvider>
  </StrictMode>,
)
