"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponUsageRelations = exports.couponsRelations = exports.complaintsRelations = exports.cartItemsRelations = exports.productCategoriesRelations = exports.notificationsRelations = exports.paymentsRelations = exports.paymentInfoRelations = exports.orderStatusRelations = exports.orderItemsRelations = exports.ordersRelations = exports.specialDealsRelations = exports.productSlotsRelations = exports.deliverySlotInfoRelations = exports.productInfoRelations = exports.unitsRelations = exports.addressesRelations = exports.staffUsersRelations = exports.userCredsRelations = exports.usersRelations = exports.couponUsage = exports.coupons = exports.complaints = exports.cartItems = exports.productCategories = exports.notifications = exports.keyValStore = exports.payments = exports.paymentInfoTable = exports.orderStatus = exports.orderItems = exports.orders = exports.specialDeals = exports.productSlots = exports.deliverySlotInfo = exports.productInfo = exports.units = exports.staffUsers = exports.addresses = exports.userCreds = exports.users = void 0;
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
});
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
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.staffUsers = mf.table('staff_users', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    password: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
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
    isOutOfStock: (0, pg_core_1.boolean)('is_out_of_stock').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.deliverySlotInfo = mf.table('delivery_slot_info', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    deliveryTime: (0, pg_core_1.timestamp)('delivery_time').notNull(),
    freezeTime: (0, pg_core_1.timestamp)('freeze_time').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    deliverySequence: (0, pg_core_1.jsonb)('delivery_sequence').$defaultFn(() => []),
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
    cancelReason: (0, pg_core_1.varchar)('cancel_reason', { length: 255 }),
    isRefundDone: (0, pg_core_1.boolean)('is_refund_done').notNull().default(false),
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
exports.complaints = mf.table('complaints', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    orderId: (0, pg_core_1.integer)('order_id').references(() => exports.orders.id),
    complaintBody: (0, pg_core_1.varchar)('complaint_body', { length: 1000 }).notNull(),
    isResolved: (0, pg_core_1.boolean)('is_resolved').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.coupons = mf.table('coupons', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    couponCode: (0, pg_core_1.varchar)('coupon_code', { length: 50 }).notNull().unique('unique_coupon_code'),
    isUserBased: (0, pg_core_1.boolean)('is_user_based').notNull().default(false),
    discountPercent: (0, pg_core_1.numeric)('discount_percent', { precision: 5, scale: 2 }),
    flatDiscount: (0, pg_core_1.numeric)('flat_discount', { precision: 10, scale: 2 }),
    minOrder: (0, pg_core_1.numeric)('min_order', { precision: 10, scale: 2 }),
    targetUser: (0, pg_core_1.integer)('target_user').references(() => exports.users.id),
    createdBy: (0, pg_core_1.integer)('created_by').notNull().references(() => exports.staffUsers.id),
    maxValue: (0, pg_core_1.numeric)('max_value', { precision: 10, scale: 2 }),
    isApplyForAll: (0, pg_core_1.boolean)('is_apply_for_all').notNull().default(false),
    validTill: (0, pg_core_1.timestamp)('valid_till'),
    maxLimitForUser: (0, pg_core_1.integer)('max_limit_for_user'),
    isInvalidated: (0, pg_core_1.boolean)('is_invalidated').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.couponUsage = mf.table('coupon_usage', {
    id: (0, pg_core_1.integer)().primaryKey().generatedAlwaysAsIdentity(),
    userId: (0, pg_core_1.integer)('user_id').notNull().references(() => exports.users.id),
    couponId: (0, pg_core_1.integer)('coupon_id').notNull().references(() => exports.coupons.id),
    usedAt: (0, pg_core_1.timestamp)('used_at').notNull().defaultNow(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many, one }) => ({
    addresses: many(exports.addresses),
    orders: many(exports.orders),
    notifications: many(exports.notifications),
    cartItems: many(exports.cartItems),
    userCreds: one(exports.userCreds),
    coupons: many(exports.coupons),
    couponUsages: many(exports.couponUsage),
}));
exports.userCredsRelations = (0, drizzle_orm_1.relations)(exports.userCreds, ({ one }) => ({
    user: one(exports.users, { fields: [exports.userCreds.userId], references: [exports.users.id] }),
}));
exports.staffUsersRelations = (0, drizzle_orm_1.relations)(exports.staffUsers, ({ many }) => ({
    coupons: many(exports.coupons),
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
exports.complaintsRelations = (0, drizzle_orm_1.relations)(exports.complaints, ({ one }) => ({
    user: one(exports.users, { fields: [exports.complaints.userId], references: [exports.users.id] }),
    order: one(exports.orders, { fields: [exports.complaints.orderId], references: [exports.orders.id] }),
}));
exports.couponsRelations = (0, drizzle_orm_1.relations)(exports.coupons, ({ one, many }) => ({
    targetUser: one(exports.users, { fields: [exports.coupons.targetUser], references: [exports.users.id] }),
    creator: one(exports.staffUsers, { fields: [exports.coupons.createdBy], references: [exports.staffUsers.id] }),
    usages: many(exports.couponUsage),
}));
exports.couponUsageRelations = (0, drizzle_orm_1.relations)(exports.couponUsage, ({ one }) => ({
    user: one(exports.users, { fields: [exports.couponUsage.userId], references: [exports.users.id] }),
    coupon: one(exports.coupons, { fields: [exports.couponUsage.couponId], references: [exports.coupons.id] }),
}));
