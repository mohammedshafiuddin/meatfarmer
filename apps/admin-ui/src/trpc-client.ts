import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import {AppRouter} from '../../backend/src/trpc/router'
import { API_BASE_URL } from '@/services/axios-admin-ui';

// Create tRPC React hooks without strict typing for now
export const trpc = createTRPCReact<AppRouter>();

// Create tRPC client for direct usage
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_BASE_URL+'/api/trpc',
      // url: 'http://localhost:4000/api/trpc',
    }),
  ],
});