import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { ProductController } from './product.controller';
import { ProductValidation } from './product.validation';
const router = express.Router();

router
    .route('/')
    .get(validateRequest(ProductValidation.list), ProductController.list)
    .post(validateRequest(ProductValidation.create), ProductController.create)
    .all(methodNotAllowed('GET', 'POST'));

router.route('/search').get(validateRequest(ProductValidation.search), ProductController.search).all(methodNotAllowed('GET'));
router.route('/categories').get(validateRequest(ProductValidation.categories), ProductController.categories).all(methodNotAllowed('GET'));
router.get('/category/:category', validateRequest(ProductValidation.byCategory), ProductController.byCategory);

router
    .route('/:id')
    .get(validateRequest(ProductValidation.detail), ProductController.getById)
    .put(validateRequest(ProductValidation.replace), ProductController.replace)
    .patch(validateRequest(ProductValidation.patch), ProductController.patch)
    .delete(validateRequest(ProductValidation.remove), ProductController.remove)
    .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));

export const ProductRoutes = router;
