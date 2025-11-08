import { createTRPCProxyClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import {AppRouter} from '../../backend/src/trpc/router'
import { BASE_API_URL } from 'common-ui';
import { getJWT } from '@/hooks/useJWT';
import { FORCE_LOGOUT_EVENT } from 'common-ui/src/lib/const-strs';
import { DeviceEventEmitter } from 'react-native';

// Create tRPC React hooks without strict typing for now
export const trpc = createTRPCReact<AppRouter>();

// Create tRPC client for direct usage
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: BASE_API_URL+'/api/trpc',
      headers: async () => {
        const token = await getJWT();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch: async (url, options) => {
        const response = await fetch(url, options);
        if (response.status === 401) {
          const data = await response.clone().json().catch(() => ({}));
          let code = '';
          if(data[0]?.error || data?.error) {
            code = data[0]?.error?.message || data?.error?.message
          }
          if (code === 'UNAUTHORIZED') {
            DeviceEventEmitter.emit(FORCE_LOGOUT_EVENT);
          }
        }
        return response;
      },
    }),
  ],
});