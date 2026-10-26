import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { PostController } from './post.controller';
import { PostValidation } from './post.validation';
const router = express.Router();

router
    .route('/')
    .get(validateRequest(PostValidation.list), PostController.list)
    .post(validateRequest(PostValidation.create), PostController.create)
    .all(methodNotAllowed('GET', 'POST'));

router.route('/search').get(validateRequest(PostValidation.search), PostController.search).all(methodNotAllowed('GET'));

router
    .route('/:id')
    .get(validateRequest(PostValidation.detail), PostController.getById)
    .put(validateRequest(PostValidation.replace), PostController.replace)
    .patch(validateRequest(PostValidation.patch), PostController.patch)
    .delete(validateRequest(PostValidation.remove), PostController.remove)
    .all(methodNotAllowed('GET', 'PUT', 'PATCH', 'DELETE'));

router.get('/:id/comments', validateRequest(PostValidation.relation('comments')), PostController.comments);

export const PostRoutes = router;
