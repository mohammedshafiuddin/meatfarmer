import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';

export interface Context {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user?: any;
  staffUser?: {
    id: number;
    name: string;
  } | null;
}

const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;
export const router = t.router;
export { TRPCError };

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {

    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next();
  })
);

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;