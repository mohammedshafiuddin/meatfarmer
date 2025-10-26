import { router, publicProcedure } from './trpc-index';
import { z } from 'zod';
import { adminRouter } from './admin-apis/admin-trpc-index';
import { userRouter } from './user-apis/user-trpc-index';
import { commonApiRouter } from './common-apis/common-trpc-index';

// Create the main app router
export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` };
    }),
  admin: adminRouter,
  user: userRouter,
  common: commonApiRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;