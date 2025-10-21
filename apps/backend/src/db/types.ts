import type { InferSelectModel } from "drizzle-orm";
import type {
  users,
  addresses,
  units,
  productInfo,
  deliverySlotInfo,
  productSlots,
  specialDeals,
  orders,
  orderItems,
  payments,
  notifications,
  productCategories,
  cartItems,
  coupons,
} from "./schema";

export type User = InferSelectModel<typeof users>;
export type Address = InferSelectModel<typeof addresses>;
export type Unit = InferSelectModel<typeof units>;
export type ProductInfo = InferSelectModel<typeof productInfo>;
export type DeliverySlotInfo = InferSelectModel<typeof deliverySlotInfo>;
export type ProductSlot = InferSelectModel<typeof productSlots>;
export type SpecialDeal = InferSelectModel<typeof specialDeals>;
export type Order = InferSelectModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type Payment = InferSelectModel<typeof payments>;
export type Notification = InferSelectModel<typeof notifications>;
export type ProductCategory = InferSelectModel<typeof productCategories>;
export type CartItem = InferSelectModel<typeof cartItems>;
export type Coupon = InferSelectModel<typeof coupons>;

// Combined types
export type ProductWithUnit = ProductInfo & {
  unit: Unit;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product: ProductInfo })[];
  address: Address;
  slot: DeliverySlotInfo;
};

export type CartItemWithProduct = CartItem & {
  product: ProductInfo;
};