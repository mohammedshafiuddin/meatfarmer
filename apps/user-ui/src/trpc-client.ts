import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "../../backend/src/trpc/router";
import { BASE_API_URL } from "common-ui";
import { getAuthToken } from "@/hooks/useJWT";

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
    }),
  ],
});
