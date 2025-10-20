import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSlots
} from './cart.controller';

const router = Router();

router.use(verifyToken);

router.get('/', getCart);
router.get('/slots', getCartSlots);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

export default router;