import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "../../backend/src/trpc/router";
import { BASE_API_URL } from "common-ui";
import { getAuthToken } from "@/hooks/useJWT";
import { DeviceEventEmitter } from "react-native";
import { FORCE_LOGOUT_EVENT } from "common-ui/src/lib/const-strs";

// Create tRPC React hooks without strict typing for now
export const trpc = createTRPCReact<AppRouter>();

// Create tRPC client for direct usage
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: BASE_API_URL + "/api/trpc",
      headers: async () => {
        const token = await getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch: async (url, options) => {
        const response = await fetch(url, options);
        if (response.status === 401) {
          const data = await response
            .clone()
            .json()
            .catch(() => ({}));
          let code = "";
          if (data[0]?.error || data?.error) {
            code = data[0]?.error?.message || data?.error?.message;
          }
          if (code === "UNAUTHORIZED") {
            DeviceEventEmitter.emit(FORCE_LOGOUT_EVENT);
          }
        }
        return response;
      },
    }),
  ],
});
