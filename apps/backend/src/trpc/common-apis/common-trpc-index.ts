import { router, publicProcedure } from '../trpc-index';
import { commonRouter } from './common';
import { db } from '../../db/db_index';
import { storeInfo } from '../../db/schema';

export const commonApiRouter = router({
  product: commonRouter,
  getStoresSummary: publicProcedure
    .query(async () => {
      const stores = await db.query.storeInfo.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
        },
      });

      return {
        stores,
      };
    }),
});

export type CommonApiRouter = typeof commonApiRouter;