import type { CartResponse } from '@/types';

/**
 * A made-up cart for the editor's live preview, so a seller can see how their cart looks without having
 * anything in a real cart. It never reaches any cart store or API.
 */
export const MOCK_CART: CartResponse = {
  cartId: -1,
  businessId: -1,
  products: [
    { productId: -1, name: 'Sample item', type: '', image: '', unit: 'piece', unitId: -1, quantity: 2, unitPrice: 2500, totalPrice: 5000 },
    { productId: -2, name: 'Another item', type: '', image: '', unit: 'piece', unitId: -2, quantity: 1, unitPrice: 1200, totalPrice: 1200 },
  ],
  totalCost: 6200,
  groups: [],
};
