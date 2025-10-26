import { router } from '../trpc-index';
import { commonRouter } from './common';

export const commonApiRouter = router({
  product: commonRouter,
});

export type CommonApiRouter = typeof commonApiRouter;