import { router, protectedProcedure } from '../trpc-index';
import { z } from 'zod';
import { generateUploadUrl } from '../../lib/s3-client';
import { ApiError } from '../../lib/api-error';

export const fileUploadRouter = router({
  generateUploadUrls: protectedProcedure
    .input(z.object({
      contextString: z.enum(['review', 'product_info']),
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
        } else if(contextString === 'product_info') {
          folder = 'product-images';
        } else if(contextString === 'review_response') {
          folder = 'review-response-images'
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
      
        console.log({uploadUrls})
      return { uploadUrls };
    }),
});

export type FileUploadRouter = typeof fileUploadRouter;