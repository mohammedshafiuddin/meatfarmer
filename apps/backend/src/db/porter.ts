/*
* This was a one time script to change the composition of the signed urls
*/

import { db } from './db_index';
import {
  userDetails,
  productInfo,
  productTagInfo,
  complaints
} from './schema';
import { eq, not, isNull } from 'drizzle-orm';

const S3_DOMAIN = 'https://s3.sgp.io.cloud.ovh.net';

const cleanImageUrl = (url: string): string => {
  if (url.startsWith(S3_DOMAIN)) {
    return url.replace(S3_DOMAIN + '/', '');
  }
  return url;
};

const cleanImageUrls = (urls: string[]): string[] => {
  return urls.map(cleanImageUrl);
};

async function migrateUserDetails() {
  console.log('Migrating userDetails...');
  const users = await db.select().from(userDetails).where(not(isNull(userDetails.profileImage)));

  console.log(`Found ${users.length} user records with profile images`);

  for (const user of users) {
    if (user.profileImage) {
      const cleanedUrl = cleanImageUrl(user.profileImage);
      await db.update(userDetails)
        .set({ profileImage: cleanedUrl })
        .where(eq(userDetails.id, user.id));
    }
  }

  console.log('userDetails migration completed');
}

async function migrateProductInfo() {
  console.log('Migrating productInfo...');
  const products = await db.select().from(productInfo).where(not(isNull(productInfo.images)));

  console.log(`Found ${products.length} product records with images`);

  for (const product of products) {
    if (product.images && Array.isArray(product.images)) {
      const cleanedUrls = cleanImageUrls(product.images);
      await db.update(productInfo)
        .set({ images: cleanedUrls })
        .where(eq(productInfo.id, product.id));
    }
  }

  console.log('productInfo migration completed');
}

async function migrateProductTagInfo() {
  console.log('Migrating productTagInfo...');
  const tags = await db.select().from(productTagInfo).where(not(isNull(productTagInfo.imageUrl)));

  console.log(`Found ${tags.length} tag records with images`);

  for (const tag of tags) {
    if (tag.imageUrl) {
      const cleanedUrl = cleanImageUrl(tag.imageUrl);
      await db.update(productTagInfo)
        .set({ imageUrl: cleanedUrl })
        .where(eq(productTagInfo.id, tag.id));
    }
  }

  console.log('productTagInfo migration completed');
}

async function migrateComplaints() {
  console.log('Migrating complaints...');
  const complaintRecords = await db.select().from(complaints).where(not(isNull(complaints.images)));

  console.log(`Found ${complaintRecords.length} complaint records with images`);

  for (const complaint of complaintRecords) {
    if (complaint.images && Array.isArray(complaint.images)) {
      const cleanedUrls = cleanImageUrls(complaint.images);
      await db.update(complaints)
        .set({ images: cleanedUrls })
        .where(eq(complaints.id, complaint.id));
    }
  }

  console.log('complaints migration completed');
}

async function runMigration() {
  console.log('Starting image URL migration...');
  console.log(`Removing S3 domain: ${S3_DOMAIN}`);

  try {
    await migrateUserDetails();
    await migrateProductInfo();
    await migrateProductTagInfo();
    await migrateComplaints();

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Process failed:', error);
    process.exit(1);
  });