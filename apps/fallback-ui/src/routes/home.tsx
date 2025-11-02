import { useState } from 'react'
import type { Person } from 'common-ui/shared-types'
import { Button } from '@/components/ui/button'
import { trpc } from '../trpc/client'

const fallbackResident: Person = {
  name: 'Fallback Admin',
  age: 0,
  email: 'admin@fallback.local'
}

export function HomeRoute() {
  const [name] = useState(fallbackResident.name)
  const helloQuery = trpc.hello.useQuery(
    { name },
    {
      suspense: false,
      staleTime: 1000 * 30
    }
  )

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Welcome</h2>
            <p className="text-sm text-slate-500">
              Shared type example: <span className="font-medium">{fallbackResident.email}</span>
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => helloQuery.refetch()}
            disabled={helloQuery.isFetching}
          >
            {helloQuery.isFetching ? 'Refreshing…' : 'Refresh Greeting'}
          </Button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          {helloQuery.isLoading ? (
            <p>Fetching greeting…</p>
          ) : helloQuery.error ? (
            <p className="text-red-600">
              Failed to fetch greeting: {helloQuery.error.message}
            </p>
          ) : (
            <p className="text-emerald-600">{helloQuery.data?.greeting}</p>
          )}
        </div>
      </div>
    </section>
  )
}
