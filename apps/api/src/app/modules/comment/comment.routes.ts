import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { CommentController } from './comment.controller';
import { CommentValidation } from './comment.validation';
const router = express.Router();

router
    .route('/')
    .get(validateRequest(CommentValidation.list), CommentController.list)
    .post(validateRequest(CommentValidation.create), CommentController.create)
    .all(methodNotAllowed('GET', 'POST'));

router
    .route('/:id')
    .get(validateRequest(CommentValidation.detail), CommentController.getById)
    .put(validateRequest(CommentValidation.replace), CommentController.replace)
    .patch(validateRequest(CommentValidation.patch), CommentController.patch)
    .delete(validateRequest(CommentValidation.remove), CommentController.remove)
    .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));

export const CommentRoutes = router;
