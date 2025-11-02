import { useMemo } from 'react'
import { useSearch } from '@tanstack/react-router'
import { trpc } from '../trpc/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface VendorOrder {
  orderId: string
  customerName: string
  orderDate: string
  totalAmount: string
  products: Array<{
    productName: string
    quantity: number
    unit: string
  }>
}

export function VendorOrderListRoute() {
  const { id } = useSearch({ from: '/vendor-order-list' })

  const { data, error, isLoading, isFetching, refetch } = id
    ? trpc.admin.vendorSnippets.getOrdersBySnippet.useQuery({ snippetCode: id })
    : { data: null, error: null, isLoading: false, isFetching: false, refetch: () => {} }

  const orders = data?.success ? data.data : []
  

  const productSummary = useMemo(() => {
    const summary: Record<string, { quantity: number; unit: string }> = {};

    orders.forEach(order => {
      order.products.forEach(product => {
        const key = product.productName;
        if (!summary[key]) {
          summary[key] = { quantity: 0, unit: product.unit };
        }
        summary[key].quantity += product.quantity;
      });
    });

    return Object.entries(summary).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      unit: data.unit
    }));
  }, [orders])

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Summary</h2>
        <div className="grid gap-2">
          {productSummary.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.name}:</span>
              <span className="font-medium text-slate-900">{item.quantity} {item.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Vendor Orders</h2>
            <p className="text-sm text-slate-500">
              Track incoming orders and fulfilment progress for vendor partners.
              {id && <span className="block mt-1 text-xs">Snippet: {id}</span>}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <div className="mt-6">
           {isLoading ? (
             <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
               Loading orders…
             </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                {error.message ?? 'Unable to load vendor orders right now'}
              </div>
            ) : !id ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                No snippet code provided
              </div>
            ) : orders.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-600">
              No vendor orders found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => {
                const parsedDate = order.orderDate
                  ? new Date(order.orderDate).toLocaleString()
                  : 'N/A'
                const badgeClass = 'border-slate-200 bg-slate-100 text-slate-600 inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold uppercase'

                return (
                  <article
                    key={order.orderId}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <header className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-900">
                        {order.orderId}
                      </h3>
                      <span className={badgeClass}>
                        Pending
                      </span>
                    </header>
                     <dl className="grid gap-3 text-sm text-slate-600">
                       <div className="space-y-1">
                         <dt className="text-xs uppercase tracking-wide text-slate-400">
                           Products
                         </dt>
                          <dd className="font-medium text-slate-900">
                            {order.products.map((product, index) => (
                              <div key={index} className="text-sm">
                                {product.productName}: {product.quantity} {product.unit}
                              </div>
                            ))}
                          </dd>
                       </div>
                       <div className="space-y-1">
                         <dt className="text-xs uppercase tracking-wide text-slate-400">
                           Date
                         </dt>
                         <dd className="font-medium text-slate-900">{parsedDate}</dd>
                       </div>
                        <div className="space-y-1">
                          <dt className="text-xs uppercase tracking-wide text-slate-400">
                            Total Amount
                          </dt>
                          <dd className="font-medium text-slate-900">
                            ₹{order.totalAmount}
                          </dd>
                        </div>
                     </dl>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {isFetching && !isLoading ? (
          <p className="mt-4 text-xs text-slate-500">Refreshing…</p>
        ) : null}
      </div>
    </section>
  )
}

const statusBadgeStyles: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-100 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-100 text-rose-700',
  inprogress: 'border-sky-200 bg-sky-100 text-sky-700',
  dispatched: 'border-indigo-200 bg-indigo-100 text-indigo-700'
}
