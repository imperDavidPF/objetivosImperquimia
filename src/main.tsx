import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Objectives } from './Objectives.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Objectives />
  </StrictMode>,
)
