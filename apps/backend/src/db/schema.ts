import { pgTable, pgSchema, integer, varchar, date, boolean, timestamp, numeric, jsonb, pgEnum, unique, real, text, check } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const mf = pgSchema('mf');



export const users = mf.table('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }),
  email: varchar({ length: 255 }),
  mobile: varchar({ length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  unq_email: unique('unique_email').on(t.email),
}));

export const userDetails = mf.table('user_details', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id).unique(),
  bio: varchar('bio', { length: 500 }),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  occupation: varchar('occupation', { length: 100 }),
  profileImage: varchar('profile_image', { length: 500 }),
  isSuspended: boolean('is_suspended').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userCreds = mf.table('user_creds', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  userPassword: varchar('user_password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const addresses = mf.table('addresses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const staffUsers = mf.table('staff_users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const storeInfo = mf.table('store_info', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  owner: integer('owner').notNull().references(() => staffUsers.id),
});

export const units = mf.table('units', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  shortNotation: varchar('short_notation', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
}, (t) => ({
  unq_short_notation: unique('unique_short_notation').on(t.shortNotation),
}));

export const productInfo = mf.table('product_info', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  shortDescription: varchar('short_description', { length: 500 }),
  longDescription: varchar('long_description', { length: 1000 }),
  unitId: integer('unit_id').notNull().references(() => units.id),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  marketPrice: numeric('market_price', { precision: 10, scale: 2 }),
  images: jsonb('images'),
  isOutOfStock: boolean('is_out_of_stock').notNull().default(false),
  isSuspended: boolean('is_suspended').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  storeId: integer('store_id').notNull().references(() => storeInfo.id),
});

export const productReviews = mf.table('product_reviews', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  productId: integer('product_id').notNull().references(() => productInfo.id),
  reviewBody: text('review_body').notNull(),
  imageUrls: jsonb('image_urls').$defaultFn(() => []),
  reviewTime: timestamp('review_time').notNull().defaultNow(),
  ratings: real('ratings').notNull(),
  adminResponse: text('admin_response'),
  adminResponseImages: jsonb('admin_response_images').$defaultFn(() => []),
}, (t) => ({
  ratingCheck: check('rating_check', sql`${t.ratings} >= 1 AND ${t.ratings} <= 5`),
}));

export const uploadStatusEnum = pgEnum('upload_status', ['pending', 'claimed']);

export const uploadUrlStatus = mf.table('upload_url_status', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  key: varchar('key', { length: 500 }).notNull(),
  status: uploadStatusEnum('status').notNull().default('pending'),
});

export const productTagInfo = mf.table('product_tag_info', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tagName: varchar('tag_name', { length: 100 }).notNull().unique(),
  tagDescription: varchar('tag_description', { length: 500 }),
  imageUrl: varchar('image_url', { length: 500 }),
  isDashboardTag: boolean('is_dashboard_tag').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productTags = mf.table('product_tags', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer('product_id').notNull().references(() => productInfo.id),
  tagId: integer('tag_id').notNull().references(() => productTagInfo.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
}, (t) => ({
  unq_product_tag: unique('unique_product_tag').on(t.productId, t.tagId),
}));

export const deliverySlotInfo = mf.table('delivery_slot_info', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  deliveryTime: timestamp('delivery_time').notNull(),
  freezeTime: timestamp('freeze_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  deliverySequence: jsonb('delivery_sequence').$defaultFn(() => []),
});

export const vendorSnippets = mf.table('vendor_snippets', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  snippetCode: varchar('snippet_code', { length: 255 }).notNull().unique(),
  slotId: integer('slot_id').notNull().references(() => deliverySlotInfo.id),
  productIds: integer('product_ids').array().notNull(),
  validTill: timestamp('valid_till'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const vendorSnippetsRelations = relations(vendorSnippets, ({ one }) => ({
  slot: one(deliverySlotInfo, { fields: [vendorSnippets.slotId], references: [deliverySlotInfo.id] }),
}));

export const productSlots = mf.table('product_slots', {
  productId: integer('product_id').notNull().references(() => productInfo.id),
  slotId: integer('slot_id').notNull().references(() => deliverySlotInfo.id),
}, (t) => ({
  pk: unique('product_slot_pk').on(t.productId, t.slotId),
}));

export const specialDeals = mf.table('special_deals', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer('product_id').notNull().references(() => productInfo.id),
  quantity: numeric({ precision: 10, scale: 2 }).notNull(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  validTill: timestamp('valid_till').notNull(),
});

export const orders = mf.table('orders', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  addressId: integer('address_id').notNull().references(() => addresses.id),
  slotId: integer('slot_id').references(() => deliverySlotInfo.id),
  isCod: boolean('is_cod').notNull().default(false),
  isOnlinePayment: boolean('is_online_payment').notNull().default(false),
  paymentInfoId: integer('payment_info_id').references(() => paymentInfoTable.id),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  readableId: integer('readable_id').notNull(),
  adminNotes: text('admin_notes'),
  userNotes: text('user_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = mf.table('order_items', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => productInfo.id),
  quantity: varchar('quantity', { length: 50 }).notNull(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  discountedPrice: numeric('discounted_price', { precision: 10, scale: 2 }),
});

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'cod', 'failed']);

export const orderStatus = mf.table('order_status', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderTime: timestamp('order_time').notNull().defaultNow(),
  userId: integer('user_id').notNull().references(() => users.id),
  orderId: integer('order_id').notNull().references(() => orders.id),
  isPackaged: boolean('is_packaged').notNull().default(false),
  isDelivered: boolean('is_delivered').notNull().default(false),
  isCancelled: boolean('is_cancelled').notNull().default(false),
  cancelReason: varchar('cancel_reason', { length: 255 }),
  paymentStatus: paymentStatusEnum('payment_state').notNull().default('pending'),
  cancellationUserNotes: text('cancellation_user_notes'),
  cancellationAdminNotes: text('cancellation_admin_notes'),
  cancellationReviewed: boolean('cancellation_reviewed').notNull().default(false),
  cancellationReviewedAt: timestamp('cancellation_reviewed_at'),
  refundCouponId: integer('refund_coupon_id').references(() => coupons.id),
});

export const paymentInfoTable = mf.table('payment_info', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  status: varchar({ length: 50 }).notNull(),
  gateway: varchar({ length: 50 }).notNull(),
  orderId: varchar('order_id', { length: 500 }),
  token: varchar({ length: 500 }),
  merchantOrderId: varchar('merchant_order_id', { length: 255 }).notNull().unique(),
  payload: jsonb('payload'),
});

export const payments = mf.table('payments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  status: varchar({ length: 50 }).notNull(),
  gateway: varchar({ length: 50 }).notNull(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  token: varchar({ length: 500 }),
  merchantOrderId: varchar('merchant_order_id', { length: 255 }).notNull().unique(),
  payload: jsonb('payload'),
});

export const refunds = mf.table('refunds', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }),
  refundStatus: varchar('refund_status', { length: 50 }).default('none'),
  merchantRefundId: varchar('merchant_refund_id', { length: 255 }),
  refundProcessedAt: timestamp('refund_processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const keyValStore = mf.table('key_val_store', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: jsonb('value'),
});

export const notifications = mf.table('notifications', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar({ length: 255 }).notNull(),
  body: varchar({ length: 512 }).notNull(),
  type: varchar({ length: 50 }),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productCategories = mf.table('product_categories', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
});

export const cartItems = mf.table('cart_items', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  productId: integer('product_id').notNull().references(() => productInfo.id),
  quantity: numeric({ precision: 10, scale: 2 }).notNull(),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (t) => ({
  unq_user_product: unique('unique_user_product').on(t.userId, t.productId),
}));

export const complaints = mf.table('complaints', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  orderId: integer('order_id').references(() => orders.id),
  complaintBody: varchar('complaint_body', { length: 1000 }).notNull(),
  images: jsonb('images'),
  response: varchar('response', { length: 1000 }),
  isResolved: boolean('is_resolved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const coupons = mf.table('coupons', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  couponCode: varchar('coupon_code', { length: 50 }).notNull().unique('unique_coupon_code'),
  isUserBased: boolean('is_user_based').notNull().default(false),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }),
  flatDiscount: numeric('flat_discount', { precision: 10, scale: 2 }),
  minOrder: numeric('min_order', { precision: 10, scale: 2 }),
  targetUser: integer('target_user').references(() => users.id),
  productIds: jsonb('product_ids'),
  createdBy: integer('created_by').notNull().references(() => staffUsers.id),
  maxValue: numeric('max_value', { precision: 10, scale: 2 }),
  isApplyForAll: boolean('is_apply_for_all').notNull().default(false),
  validTill: timestamp('valid_till'),
  maxLimitForUser: integer('max_limit_for_user'),
  isInvalidated: boolean('is_invalidated').notNull().default(false),
  exclusiveApply: boolean('exclusive_apply').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const couponUsage = mf.table('coupon_usage', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  couponId: integer('coupon_id').notNull().references(() => coupons.id),
  orderId: integer('order_id').references(() => orders.id),
  orderItemId: integer('order_item_id').references(() => orderItems.id),
  usedAt: timestamp('used_at').notNull().defaultNow(),
});

export const couponApplicableUsers = mf.table('coupon_applicable_users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  couponId: integer('coupon_id').notNull().references(() => coupons.id),
  userId: integer('user_id').notNull().references(() => users.id),
}, (t) => ({
  unq_coupon_user: unique('unique_coupon_user').on(t.couponId, t.userId),
}));

export const couponApplicableProducts = mf.table('coupon_applicable_products', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  couponId: integer('coupon_id').notNull().references(() => coupons.id),
  productId: integer('product_id').notNull().references(() => productInfo.id),
}, (t) => ({
  unq_coupon_product: unique('unique_coupon_product').on(t.couponId, t.productId),
}));

export const notifCreds = mf.table('notif_creds', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  token: varchar({ length: 500 }).notNull().unique(),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  userId: integer('user_id').notNull().references(() => users.id),
  lastVerified: timestamp('last_verified'),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  notifications: many(notifications),
  cartItems: many(cartItems),
  userCreds: one(userCreds),
  coupons: many(coupons),
  couponUsages: many(couponUsage),
  applicableCoupons: many(couponApplicableUsers),
  userDetails: one(userDetails),
  notifCreds: many(notifCreds),
}));

export const userCredsRelations = relations(userCreds, ({ one }) => ({
  user: one(users, { fields: [userCreds.userId], references: [users.id] }),
}));

export const staffUsersRelations = relations(staffUsers, ({ many }) => ({
  coupons: many(coupons),
  stores: many(storeInfo),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
  orders: many(orders),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  products: many(productInfo),
}));

export const productInfoRelations = relations(productInfo, ({ one, many }) => ({
  unit: one(units, { fields: [productInfo.unitId], references: [units.id] }),
  store: one(storeInfo, { fields: [productInfo.storeId], references: [storeInfo.id] }),
  productSlots: many(productSlots),
  specialDeals: many(specialDeals),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  tags: many(productTags),
  applicableCoupons: many(couponApplicableProducts),
  reviews: many(productReviews),
}));

export const productTagInfoRelations = relations(productTagInfo, ({ many }) => ({
  products: many(productTags),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(productInfo, { fields: [productTags.productId], references: [productInfo.id] }),
  tag: one(productTagInfo, { fields: [productTags.tagId], references: [productTagInfo.id] }),
}));

export const deliverySlotInfoRelations = relations(deliverySlotInfo, ({ many }) => ({
  productSlots: many(productSlots),
  orders: many(orders),
}));

export const productSlotsRelations = relations(productSlots, ({ one }) => ({
  product: one(productInfo, { fields: [productSlots.productId], references: [productInfo.id] }),
  slot: one(deliverySlotInfo, { fields: [productSlots.slotId], references: [deliverySlotInfo.id] }),
}));

export const specialDealsRelations = relations(specialDeals, ({ one }) => ({
  product: one(productInfo, { fields: [specialDeals.productId], references: [productInfo.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  address: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  slot: one(deliverySlotInfo, { fields: [orders.slotId], references: [deliverySlotInfo.id] }),
  orderItems: many(orderItems),
  payment: one(payments),
  paymentInfo: one(paymentInfoTable, { fields: [orders.paymentInfoId], references: [paymentInfoTable.id] }),
  orderStatus: many(orderStatus),
  refunds: many(refunds),
  couponUsages: many(couponUsage),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(productInfo, { fields: [orderItems.productId], references: [productInfo.id] }),
}));

export const orderStatusRelations = relations(orderStatus, ({ one }) => ({
  order: one(orders, { fields: [orderStatus.orderId], references: [orders.id] }),
  user: one(users, { fields: [orderStatus.userId], references: [users.id] }),
  refundCoupon: one(coupons, { fields: [orderStatus.refundCouponId], references: [coupons.id] }),
}));

export const paymentInfoRelations = relations(paymentInfoTable, ({ one }) => ({
  order: one(orders, { fields: [paymentInfoTable.id], references: [orders.paymentInfoId] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, { fields: [refunds.orderId], references: [orders.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const productCategoriesRelations = relations(productCategories, ({}) => ({}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(productInfo, { fields: [cartItems.productId], references: [productInfo.id] }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  user: one(users, { fields: [complaints.userId], references: [users.id] }),
  order: one(orders, { fields: [complaints.orderId], references: [orders.id] }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  targetUser: one(users, { fields: [coupons.targetUser], references: [users.id] }),
  creator: one(staffUsers, { fields: [coupons.createdBy], references: [staffUsers.id] }),
  usages: many(couponUsage),
  applicableUsers: many(couponApplicableUsers),
  applicableProducts: many(couponApplicableProducts),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  user: one(users, { fields: [couponUsage.userId], references: [users.id] }),
  coupon: one(coupons, { fields: [couponUsage.couponId], references: [coupons.id] }),
  order: one(orders, { fields: [couponUsage.orderId], references: [orders.id] }),
  orderItem: one(orderItems, { fields: [couponUsage.orderItemId], references: [orderItems.id] }),
}));

export const userDetailsRelations = relations(userDetails, ({ one }) => ({
  user: one(users, { fields: [userDetails.userId], references: [users.id] }),
}));

export const notifCredsRelations = relations(notifCreds, ({ one }) => ({
  user: one(users, { fields: [notifCreds.userId], references: [users.id] }),
}));

export const storeInfoRelations = relations(storeInfo, ({ one, many }) => ({
  owner: one(staffUsers, { fields: [storeInfo.owner], references: [staffUsers.id] }),
  products: many(productInfo),
}));

export const couponApplicableUsersRelations = relations(couponApplicableUsers, ({ one }) => ({
  coupon: one(coupons, { fields: [couponApplicableUsers.couponId], references: [coupons.id] }),
  user: one(users, { fields: [couponApplicableUsers.userId], references: [users.id] }),
}));

export const couponApplicableProductsRelations = relations(couponApplicableProducts, ({ one }) => ({
  coupon: one(coupons, { fields: [couponApplicableProducts.couponId], references: [coupons.id] }),
  product: one(productInfo, { fields: [couponApplicableProducts.productId], references: [productInfo.id] }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  user: one(users, { fields: [productReviews.userId], references: [users.id] }),
  product: one(productInfo, { fields: [productReviews.productId], references: [productInfo.id] }),
}));