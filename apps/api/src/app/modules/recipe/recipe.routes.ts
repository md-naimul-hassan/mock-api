import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { RecipeController } from './recipe.controller';
import { RecipeValidation } from './recipe.validation';
const router = express.Router();

router.route('/').get(validateRequest(RecipeValidation.list), RecipeController.list).all(methodNotAllowed('GET'));
router.route('/search').get(validateRequest(RecipeValidation.search), RecipeController.search).all(methodNotAllowed('GET'));
router.route('/:id').get(validateRequest(RecipeValidation.detail), RecipeController.getById).all(methodNotAllowed('GET'));

export const RecipeRoutes = router;
