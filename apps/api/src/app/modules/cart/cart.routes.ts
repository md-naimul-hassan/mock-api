import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { CartController } from './cart.controller';
import { CartValidation } from './cart.validation';
const router = express.Router();

router.route('/').get(validateRequest(CartValidation.list), CartController.list).all(methodNotAllowed('GET'));
router.route('/:id').get(validateRequest(CartValidation.detail), CartController.getById).all(methodNotAllowed('GET'));

export const CartRoutes = router;
