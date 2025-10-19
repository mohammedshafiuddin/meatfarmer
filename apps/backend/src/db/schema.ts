import { pgTable, pgSchema, integer, varchar, date, boolean, timestamp, numeric, jsonb, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const mf = pgSchema('mf');

export const orderStatusEnum = pgEnum('order_status', ['pending', 'delivered', 'cancelled']);

export const users = mf.table('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  mobile: varchar({ length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  unq_email: unique('unique_email').on(t.email),
}));

export const userCreds = mf.table('user_creds', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  userPassword: varchar('user_password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  unq_user: unique('unique_user_cred').on(t.userId),
}));

export const addresses = mf.table('addresses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  address: varchar({ length: 500 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
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
  images: jsonb('images'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const deliverySlotInfo = mf.table('delivery_slot_info', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  deliveryTime: timestamp('delivery_time').notNull(),
  freezeTime: timestamp('freeze_time').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

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
  slotId: integer('slot_id').notNull().references(() => deliverySlotInfo.id),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = mf.table('order_items', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => productInfo.id),
  quantity: numeric({ precision: 10, scale: 2 }).notNull(),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  amount: numeric({ precision: 10, scale: 2 }).notNull(),
});

export const payments = mf.table('payments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: varchar({ length: 50 }).notNull(),
  gateway: varchar({ length: 50 }).notNull(),
  gatewayOrderId: varchar('gateway_order_id', { length: 255 }),
  amount: numeric({ precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  notifications: many(notifications),
  cartItems: many(cartItems),
  userCreds: one(userCreds),
}));

export const userCredsRelations = relations(userCreds, ({ one }) => ({
  user: one(users, { fields: [userCreds.userId], references: [users.id] }),
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
  productSlots: many(productSlots),
  specialDeals: many(specialDeals),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
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
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(productInfo, { fields: [orderItems.productId], references: [productInfo.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const productCategoriesRelations = relations(productCategories, ({}) => ({}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(productInfo, { fields: [cartItems.productId], references: [productInfo.id] }),
}));