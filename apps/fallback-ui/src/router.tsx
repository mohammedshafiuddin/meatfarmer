import { Link, Outlet, RootRoute, Route, createRouter } from '@tanstack/react-router'
import { Suspense } from 'react'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { z } from 'zod'
import { HomeRoute } from './routes/home'
import { VendorOrderListRoute } from './routes/vendor-order-list'
import { cn } from '@/lib/utils'

const basepath = normalizeBasePath(import.meta.env.BASE_URL)

const rootRoute = new RootRoute({
  component: RootComponent
})

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<p>Loading route…</p>}>
      <HomeRoute />
    </Suspense>
  )
})

const vendorOrderListRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/vendor-order-list',
  validateSearch: z.object({
    id: z.string().optional(),
  }),
  component: () => (
    <Suspense fallback={<p>Loading vendor orders…</p>}>
      <VendorOrderListRoute />
    </Suspense>
  )
})

const routeTree = rootRoute.addChildren([dashboardRoute, vendorOrderListRoute])

export function createAppRouter() {
  return createRouter({
    routeTree,
    basepath
  })
}

export type AppRouterInstance = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouterInstance
  }
}

const navItems = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/vendor-order-list', label: 'Vendor Order List' }
] as const

function RootComponent() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="flex justify-center pb-6 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Meat Farmer. All rights reserved.
        </footer>
        {import.meta.env.DEV ? (
          <TanStackRouterDevtools position="bottom-right" />
        ) : null}
      </div>
    </div>
  )
}

function normalizeBasePath(value: string): string {
  if (!value) return '/'
  if (value === '/') return '/'
  return value.endsWith('/') ? value.slice(0, -1) : value
}
