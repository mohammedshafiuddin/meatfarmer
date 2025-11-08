import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../backend/src/trpc/router'
import {BASE_API_URL} from 'common-ui'
import webUiConstants from '@/constants'

export const trpc = createTRPCReact<AppRouter>()



export function createTRPCClient() {
  return trpc.createClient({
    // transformer: superjson,
    links: [
      loggerLink({
        enabled: (opts) =>
          import.meta.env.DEV ||
          (opts.direction === 'down' && opts.result instanceof Error)
      }),
      httpBatchLink({
        url: webUiConstants.baseUrl+`api/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include'
          })
        }
      })
    ]
  })
}
