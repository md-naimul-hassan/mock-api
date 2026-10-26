import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
const router = express.Router();

router
    .route('/')
    .get(validateRequest(UserValidation.list), UserController.list)
    .post(validateRequest(UserValidation.create), UserController.create)
    .all(methodNotAllowed('GET', 'POST'));

router.route('/search').get(validateRequest(UserValidation.search), UserController.search).all(methodNotAllowed('GET'));

router
    .route('/:id')
    .get(validateRequest(UserValidation.detail), UserController.getById)
    .put(validateRequest(UserValidation.replace), UserController.replace)
    .patch(validateRequest(UserValidation.patch), UserController.patch)
    .delete(validateRequest(UserValidation.remove), UserController.remove)
    .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));

router.get('/:id/posts', validateRequest(UserValidation.relation('posts')), UserController.posts);
router.get('/:id/todos', validateRequest(UserValidation.relation('todos')), UserController.todos);
router.get('/:id/carts', validateRequest(UserValidation.relation('carts')), UserController.carts);

export const UserRoutes = router;
