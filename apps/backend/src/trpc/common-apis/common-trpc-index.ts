import { router, publicProcedure, protectedProcedure } from '../trpc-index';
import { commonRouter } from './common';
import { db } from '../../db/db_index';
import { productInfo, storeInfo } from '../../db/schema';
import * as turf from '@turf/turf';
import { z } from 'zod';
import { mbnrGeoJson } from '../../lib/mbnr-geojson';
import { generateUploadUrl } from '../../lib/s3-client';
import { ApiError } from '../../lib/api-error';

const polygon = turf.polygon(mbnrGeoJson.features[0].geometry.coordinates);

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
  checkLocationInPolygon: publicProcedure
    .input(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }))
    .query(({ input }) => {
      try {
        const { lat, lng } = input;
        const point = turf.point([lng, lat]); // GeoJSON: [longitude, latitude]
        const isInside = turf.booleanPointInPolygon(point, polygon);
        return { isInside };
      } catch (error) {
        throw new Error('Invalid coordinates or polygon data');
      }
    }),

  generateUploadUrls: protectedProcedure
    .input(z.object({
      contextString: z.enum(['review', 'product_info', 'store']),
      mimeTypes: z.array(z.string()),
    }))
    .mutation(async ({ input }): Promise<{ uploadUrls: string[] }> => {
      const { contextString, mimeTypes } = input;

      const uploadUrls: string[] = [];
      const keys: string[] = [];

      for (const mimeType of mimeTypes) {
        // Generate key based on context and mime type
        let folder: string;
        if (contextString === 'review') {
          folder = 'review-images';
        } else if (contextString === 'product_info') {
          folder = 'product-images';
        } else if (contextString === 'store') {
          folder = 'store-images';
        } else if (contextString === 'review_response') {
          folder = 'review-response-images';
        } else {
          folder = '';
        }

        const extension = mimeType === 'image/jpeg' ? '.jpg' :
                          mimeType === 'image/png' ? '.png' :
                          mimeType === 'image/gif' ? '.gif' : '.jpg';
        const key = `${folder}/${Date.now()}${extension}`;

        try {
          const uploadUrl = await generateUploadUrl(key, mimeType);
          uploadUrls.push(uploadUrl);
          keys.push(key);

        } catch (error) {
          console.error('Error generating upload URL:', error);
          throw new ApiError('Failed to generate upload URL', 500);
        }
      }
      return { uploadUrls };
    }),
  healthCheck: publicProcedure
      .query(async () => {
        // Test DB connection by selecting product names
        await db.select({ name: productInfo.name }).from(productInfo).limit(1);
  
        return {
          status: "ok",
        };
    }),
});

export type CommonApiRouter = typeof commonApiRouter;

// // Test call
// (async () => {
//   try {
//     // Test with coords inside Mahabubnagar (from geojson)
//     const point1 = turf.point([78.006157,16.729748,  ]); // [lng, lat]
//     // const point1 = turf.point([77.987057, 16.746621 ])
//     const isInside1 = turf.booleanPointInPolygon(point1, polygon);
//     console.log('Test 1 - Inside polygon:', isInside1);

//     // Test with coords outside
//     const point2 = turf.point([78.5, 17.0]); // [lng, lat]
//     const isInside2 = turf.booleanPointInPolygon(point2, polygon);
//     console.log('Test 2 - Outside polygon:', isInside2);
//   } catch (error) {
//     console.error('Test error:', error);
//   }
// })();