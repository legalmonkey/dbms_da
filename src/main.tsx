import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/Providers'
import { router } from '@/app/router'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found')

createRoot(container).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
