import { z } from 'zod';
import { addressZones, addressAreas } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/db_index';
import { router,protectedProcedure } from '../trpc-index';

const addressRouter = router({
  getZones: protectedProcedure.query(async () => {
    const zones = await db.select().from(addressZones).orderBy(desc(addressZones.addedAt));
    return zones
  }),

  getAreas: protectedProcedure.query(async () => {
    const areas = await db.select().from(addressAreas).orderBy(desc(addressAreas.createdAt));
    return areas
  }),

  createZone: protectedProcedure.input(z.object({ zoneName: z.string().min(1) })).mutation(async ({ input }) => {
    
    const zone = await db.insert(addressZones).values({ zoneName: input.zoneName }).returning();
    return {zone: zone};
  }),

  createArea: protectedProcedure.input(z.object({ placeName: z.string().min(1), zoneId: z.number().nullable() })).mutation(async ({ input }) => {
    const area = await db.insert(addressAreas).values({ placeName: input.placeName, zoneId: input.zoneId }).returning();
    return {area};
  }),

  // TODO: Add update and delete mutations if needed
});

export default addressRouter;