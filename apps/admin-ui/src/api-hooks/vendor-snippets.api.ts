import { trpc } from '../trpc-client';

export interface VendorSnippet {
  id: number;
  snippetCode: string;
  slotId: number;
  productIds: number[];
  validTill: string | null;
  createdAt: string;
  accessUrl: string;
  slot?: {
    id: number;
    deliveryTime: string;
    freezeTime: string;
    isActive: boolean;
    deliverySequence?: unknown;
  };
}

export interface OrderBySnippet {
  orderId: string;
  orderDate: string;
  customerName: string;
  totalAmount: string;
  slotInfo: {
    time: string;
    sequence: any[];
  } | null;
  products: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: string;
    unit: string;
    subtotal: string;
  }>;
  matchedProducts: number[];
  snippetCode: string;
}

export interface OrdersBySnippetResponse {
  success: boolean;
  data: OrderBySnippet[];
  snippet: {
    id: number;
    snippetCode: string;
    slotId: number;
    productIds: number[];
    validTill: string | null;
    createdAt: string;
  };
}

export const useVendorSnippets = () => {
  return trpc.admin.vendorSnippets.getAll.useQuery();
};

export const useVendorSnippet = (id: number) => {
  return trpc.admin.vendorSnippets.getById.useQuery({ id }, { enabled: !!id });
};

export const useCreateVendorSnippet = () => {
  return trpc.admin.vendorSnippets.create.useMutation();
};

export const useUpdateVendorSnippet = () => {
  return trpc.admin.vendorSnippets.update.useMutation();
};

export const useDeleteVendorSnippet = () => {
  return trpc.admin.vendorSnippets.delete.useMutation();
};

export const useOrdersBySnippet = (snippetCode: string) => {
  return trpc.admin.vendorSnippets.getOrdersBySnippet.useQuery(
    { snippetCode },
    { enabled: !!snippetCode }
  );
};