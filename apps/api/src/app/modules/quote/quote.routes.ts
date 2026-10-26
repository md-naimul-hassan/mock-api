import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { QuoteController } from './quote.controller';
import { QuoteValidation } from './quote.validation';
const router = express.Router();

router.route('/').get(validateRequest(QuoteValidation.list), QuoteController.list).all(methodNotAllowed('GET'));
router.route('/random').get(validateRequest(QuoteValidation.random), QuoteController.random).all(methodNotAllowed('GET'));
router.route('/:id').get(validateRequest(QuoteValidation.detail), QuoteController.getById).all(methodNotAllowed('GET'));

export const QuoteRoutes = router;
