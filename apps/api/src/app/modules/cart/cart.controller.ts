import { createReadHandlers } from '../../../helpers/resourceController';
import { CartService } from './cart.service';

export const CartController = createReadHandlers(CartService);
