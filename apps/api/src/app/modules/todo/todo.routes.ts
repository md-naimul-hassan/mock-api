import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { TodoController } from './todo.controller';
import { TodoValidation } from './todo.validation';
const router = express.Router();

router
    .route('/')
    .get(validateRequest(TodoValidation.list), TodoController.list)
    .post(validateRequest(TodoValidation.create), TodoController.create)
    .all(methodNotAllowed('GET', 'POST'));

router
    .route('/:id')
    .get(validateRequest(TodoValidation.detail), TodoController.getById)
    .put(validateRequest(TodoValidation.replace), TodoController.replace)
    .patch(validateRequest(TodoValidation.patch), TodoController.patch)
    .delete(validateRequest(TodoValidation.remove), TodoController.remove)
    .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));

export const TodoRoutes = router;
