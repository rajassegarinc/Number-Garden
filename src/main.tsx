import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './motion/motion.css'
import { initMotion } from './motion/fx'
import App from './App.tsx'

initMotion()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
