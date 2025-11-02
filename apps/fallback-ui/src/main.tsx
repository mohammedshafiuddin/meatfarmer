import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { trpc, createTRPCClient } from './trpc/client'
import { createAppRouter } from './router'
import './index.css'

const queryClient = new QueryClient()
const trpcClient = createTRPCClient()
const router = createAppRouter()

const container = document.getElementById('root')

if (!container) {
  throw new Error('Failed to find root element for the application')
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <RouterProvider router={router} />
      </trpc.Provider>
    </QueryClientProvider>
  </StrictMode>
)
