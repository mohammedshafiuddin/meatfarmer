"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartItemsRelations = exports.productCategoriesRelations = exports.notificationsRelations = exports.paymentsRelations = exports.paymentInfoRelations = exports.orderStatusRelations = exports.orderItemsRelations = exports.ordersRelations = exports.specialDealsRelations = exports.productSlotsRelations = exports.deliverySlotInfoRelations = exports.productInfoRelations = exports.unitsRelations = exports.addressesRelations = exports.userCredsRelations = exports.usersRelations = exports.cartItems = exports.productCategories = exports.notifications = exports.keyValStore = exports.payments = exports.paymentInfoTable = exports.orderStatus = exports.orderItems = exports.orders = exports.specialDeals = exports.productSlots = exports.deliverySlotInfo = exports.productInfo = exports.units = exports.addresses = exports.userCreds = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const mf = (0, pg_core_1.pgSchema)('mf');
exports.users = mf.table('users', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)({ length: 255 }),
    mobile: (0, pg_core_1.varchar)({ length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => ({
    unq_email: (0, pg_core_1.unique)('unique_email').on(t.email),
}));
exports.userCreds = mf.table('user_creds', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    userPassword: (0, pg_core_1.varchar)('user_password', { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (t) => ({
    unq_user: (0, pg_core_1.unique)('unique_user_cred').on(t.userId),
}));
exports.addresses = mf.table('addresses', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 15 }).notNull(),
    addressLine1: (0, pg_core_1.varchar)('address_line1', { length: 255 }).notNull(),
    addressLine2: (0, pg_core_1.varchar)('address_line2', { length: 255 }),
    city: (0, pg_core_1.varchar)('city', { length: 100 }).notNull(),
    state: (0, pg_core_1.varchar)('state', { length: 100 }).notNull(),
    pincode: (0, pg_core_1.varchar)('pincode', { length: 10 }).notNull(),
    isDefault: (0, pg_core_1.boolean)('is_default').notNull().default(false),
    latitude: (0, pg_core_1.real)('latitude'),
    longitude: (0, pg_core_1.real)('longitude'),
});
exports.units = mf.table('units', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    shortNotation: (0, pg_core_1.varchar)('short_notation', { length: 50 }).notNull(),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 100 }).notNull(),
}, (t) => ({
    unq_short_notation: (0, pg_core_1.unique)('unique_short_notation').on(t.shortNotation),
}));
exports.productInfo = mf.table('product_info', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    shortDescription: (0, pg_core_1.varchar)('short_description', { length: 500 }),
    longDescription: (0, pg_core_1.varchar)('long_description', { length: 1000 }),
    unitId: (0, pg_core_1.integer)('unit_id').notNull().references(() => exports.units.id),
    price: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
    images: (0, pg_core_1.jsonb)('images'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.deliverySlotInfo = mf.table('delivery_slot_info', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    deliveryTime: (0, pg_core_1.timestamp)('delivery_time').notNull(),
    freezeTime: (0, pg_core_1.timestamp)('freeze_time').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
});
exports.productSlots = mf.table('product_slots', {
    productId: (0, pg_core_1.integer)('product_id').notNull().references(() => exports.productInfo.id),
    slotId: (0, pg_core_1.integer)('slot_id').notNull().references(() => exports.deliverySlotInfo.id),
}, (t) => ({
    pk: (0, pg_core_1.unique)('product_slot_pk').on(t.productId, t.slotId),
}));
exports.specialDeals = mf.table('special_deals', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    productId: (0, pg_core_1.integer)('product_id').notNull().references(() => exports.productInfo.id),
    quantity: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
    price: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
    validTill: (0, pg_core_1.timestamp)('valid_till').notNull(),
});
exports.orders = mf.table('orders', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    addressId: (0, pg_core_1.integer)('address_id').notNull().references(() => exports.addresses.id),
    slotId: (0, pg_core_1.integer)('slot_id').references(() => exports.deliverySlotInfo.id),
    isCod: (0, pg_core_1.boolean)('is_cod').notNull().default(false),
    isOnlinePayment: (0, pg_core_1.boolean)('is_online_payment').notNull().default(false),
    paymentInfoId: (0, pg_core_1.integer)('payment_info_id').references(() => exports.paymentInfoTable.id),
    totalAmount: (0, pg_core_1.numeric)('total_amount', { precision: 10, scale: 2 }).notNull(),
    readableId: (0, pg_core_1.integer)('readable_id').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.orderItems = mf.table('order_items', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    orderId: (0, pg_core_1.integer)('order_id').notNull().references(() => exports.orders.id),
    productId: (0, pg_core_1.integer)('product_id').notNull().references(() => exports.productInfo.id),
    quantity: (0, pg_core_1.varchar)('quantity', { length: 50 }).notNull(),
    price: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
});
exports.orderStatus = mf.table('order_status', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    orderTime: (0, pg_core_1.timestamp)('order_time').notNull().defaultNow(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    orderId: (0, pg_core_1.integer)('order_id').notNull().references(() => exports.orders.id),
    isPackaged: (0, pg_core_1.boolean)('is_packaged').notNull().default(false),
    isDelivered: (0, pg_core_1.boolean)('is_delivered').notNull().default(false),
    isCancelled: (0, pg_core_1.boolean)('is_cancelled').notNull().default(false),
});
exports.paymentInfoTable = mf.table('payment_info', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    status: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    gateway: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    orderId: (0, pg_core_1.varchar)('order_id', { length: 500 }),
    token: (0, pg_core_1.varchar)({ length: 500 }),
    merchantOrderId: (0, pg_core_1.varchar)('merchant_order_id', { length: 255 }).notNull().unique(),
    payload: (0, pg_core_1.jsonb)('payload'),
});
exports.payments = mf.table('payments', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    status: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    gateway: (0, pg_core_1.varchar)({ length: 50 }).notNull(),
    orderId: (0, pg_core_1.integer)('order_id').notNull().references(() => exports.orders.id),
    token: (0, pg_core_1.varchar)({ length: 500 }),
    merchantOrderId: (0, pg_core_1.varchar)('merchant_order_id', { length: 255 }).notNull().unique(),
    payload: (0, pg_core_1.jsonb)('payload'),
});
exports.keyValStore = mf.table('key_val_store', {
    key: (0, pg_core_1.varchar)('key', { length: 255 }).primaryKey(),
    value: (0, pg_core_1.jsonb)('value'),
});
exports.notifications = mf.table('notifications', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    title: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    body: (0, pg_core_1.varchar)({ length: 512 }).notNull(),
    type: (0, pg_core_1.varchar)({ length: 50 }),
    isRead: (0, pg_core_1.boolean)('is_read').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.productCategories = mf.table('product_categories', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    description: (0, pg_core_1.varchar)({ length: 500 }),
});
exports.cartItems = mf.table('cart_items', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    productId: (0, pg_core_1.integer)('product_id').notNull().references(() => exports.productInfo.id),
    quantity: (0, pg_core_1.numeric)({ precision: 10, scale: 2 }).notNull(),
    addedAt: (0, pg_core_1.timestamp)('added_at').notNull().defaultNow(),
}, (t) => ({
    unq_user_product: (0, pg_core_1.unique)('unique_user_product').on(t.userId, t.productId),
}));
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many, one }) => ({
    addresses: many(exports.addresses),
    orders: many(exports.orders),
    notifications: many(exports.notifications),
    cartItems: many(exports.cartItems),
    userCreds: one(exports.userCreds),
}));
exports.userCredsRelations = (0, drizzle_orm_1.relations)(exports.userCreds, ({ one }) => ({
    user: one(exports.users, { fields: [exports.userCreds.userId], references: [exports.users.id] }),
}));
exports.addressesRelations = (0, drizzle_orm_1.relations)(exports.addresses, ({ one, many }) => ({
    user: one(exports.users, { fields: [exports.addresses.userId], references: [exports.users.id] }),
    orders: many(exports.orders),
}));
exports.unitsRelations = (0, drizzle_orm_1.relations)(exports.units, ({ many }) => ({
    products: many(exports.productInfo),
}));
exports.productInfoRelations = (0, drizzle_orm_1.relations)(exports.productInfo, ({ one, many }) => ({
    unit: one(exports.units, { fields: [exports.productInfo.unitId], references: [exports.units.id] }),
    productSlots: many(exports.productSlots),
    specialDeals: many(exports.specialDeals),
    orderItems: many(exports.orderItems),
    cartItems: many(exports.cartItems),
}));
exports.deliverySlotInfoRelations = (0, drizzle_orm_1.relations)(exports.deliverySlotInfo, ({ many }) => ({
    productSlots: many(exports.productSlots),
    orders: many(exports.orders),
}));
exports.productSlotsRelations = (0, drizzle_orm_1.relations)(exports.productSlots, ({ one }) => ({
    product: one(exports.productInfo, { fields: [exports.productSlots.productId], references: [exports.productInfo.id] }),
    slot: one(exports.deliverySlotInfo, { fields: [exports.productSlots.slotId], references: [exports.deliverySlotInfo.id] }),
}));
exports.specialDealsRelations = (0, drizzle_orm_1.relations)(exports.specialDeals, ({ one }) => ({
    product: one(exports.productInfo, { fields: [exports.specialDeals.productId], references: [exports.productInfo.id] }),
}));
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one, many }) => ({
    user: one(exports.users, { fields: [exports.orders.userId], references: [exports.users.id] }),
    address: one(exports.addresses, { fields: [exports.orders.addressId], references: [exports.addresses.id] }),
    slot: one(exports.deliverySlotInfo, { fields: [exports.orders.slotId], references: [exports.deliverySlotInfo.id] }),
    orderItems: many(exports.orderItems),
    payment: one(exports.payments),
    paymentInfo: one(exports.paymentInfoTable, { fields: [exports.orders.paymentInfoId], references: [exports.paymentInfoTable.id] }),
    orderStatus: many(exports.orderStatus),
}));
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.orderItems.orderId], references: [exports.orders.id] }),
    product: one(exports.productInfo, { fields: [exports.orderItems.productId], references: [exports.productInfo.id] }),
}));
exports.orderStatusRelations = (0, drizzle_orm_1.relations)(exports.orderStatus, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.orderStatus.orderId], references: [exports.orders.id] }),
    user: one(exports.users, { fields: [exports.orderStatus.userId], references: [exports.users.id] }),
}));
exports.paymentInfoRelations = (0, drizzle_orm_1.relations)(exports.paymentInfoTable, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.paymentInfoTable.id], references: [exports.orders.paymentInfoId] }),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(exports.payments, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.payments.orderId], references: [exports.orders.id] }),
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, { fields: [exports.notifications.userId], references: [exports.users.id] }),
}));
exports.productCategoriesRelations = (0, drizzle_orm_1.relations)(exports.productCategories, ({}) => ({}));
exports.cartItemsRelations = (0, drizzle_orm_1.relations)(exports.cartItems, ({ one }) => ({
    user: one(exports.users, { fields: [exports.cartItems.userId], references: [exports.users.id] }),
    product: one(exports.productInfo, { fields: [exports.cartItems.productId], references: [exports.productInfo.id] }),
}));
