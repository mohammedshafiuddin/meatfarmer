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

// Global error logger middleware
const errorLoggerMiddleware = middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();

  try {
    const result = await next();
    const duration = Date.now() - start;

    // Log successful operations in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${type} ${path} - ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    const err = error as any; // Type assertion for error object

    // Comprehensive error logging
    console.error('🚨 tRPC Error:', {
      timestamp: new Date().toISOString(),
      path,
      type,
      duration: `${duration}ms`,
      userId: ctx?.user?.userId || ctx?.staffUser?.id || 'anonymous',
      error: {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack,
      },
      // Add SQL-specific details if available
      ...(err.code && { sqlCode: err.code }),
      ...(err.meta && { sqlMeta: err.meta }),
      ...(err.sql && { sql: err.sql }),
    });

    throw error; // Re-throw to maintain error flow
  }
});

export const publicProcedure = t.procedure.use(errorLoggerMiddleware);
export const protectedProcedure = t.procedure.use(errorLoggerMiddleware).use(
  middleware(async ({ ctx, next }) => {

    if (!ctx.user && !ctx.staffUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next();
  })
);

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;