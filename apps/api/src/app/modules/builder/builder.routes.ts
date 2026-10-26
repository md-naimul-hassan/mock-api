import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { BuilderAuthController, BuilderEndpointController, BuilderProjectController } from './builder.controller';
import { requireBuilderAuth } from './builder.middleware';
import { builderValidation } from './builder.validation';

const router = express.Router();

router.route('/auth/register').post(validateRequest(builderValidation.register), BuilderAuthController.register).all(methodNotAllowed('POST'));
router.route('/auth/login').post(validateRequest(builderValidation.login), BuilderAuthController.login).all(methodNotAllowed('POST'));
router.route('/auth/me').get(requireBuilderAuth, BuilderAuthController.me).all(methodNotAllowed('GET'));

router
    .route('/public/:projectId')
    .get(validateRequest(builderValidation.projectId), BuilderProjectController.getPublic)
    .all(methodNotAllowed('GET'));

router
    .route('/projects')
    .get(requireBuilderAuth, BuilderProjectController.list)
    .post(requireBuilderAuth, validateRequest(builderValidation.createProject), BuilderProjectController.create)
    .all(methodNotAllowed('GET', 'POST'));

router
    .route('/projects/:projectId')
    .get(requireBuilderAuth, validateRequest(builderValidation.projectId), BuilderProjectController.get)
    .patch(requireBuilderAuth, validateRequest(builderValidation.updateProject), BuilderProjectController.update)
    .delete(requireBuilderAuth, validateRequest(builderValidation.projectId), BuilderProjectController.remove)
    .all(methodNotAllowed('GET', 'PATCH', 'DELETE'));

router
    .route('/projects/:projectId/duplicate')
    .post(requireBuilderAuth, validateRequest(builderValidation.projectId), BuilderProjectController.duplicate)
    .all(methodNotAllowed('POST'));

router
    .route('/projects/:projectId/endpoints')
    .post(requireBuilderAuth, validateRequest(builderValidation.createEndpoint), BuilderEndpointController.create)
    .all(methodNotAllowed('POST'));

router
    .route('/projects/:projectId/endpoints/:endpointId')
    .patch(requireBuilderAuth, validateRequest(builderValidation.updateEndpoint), BuilderEndpointController.update)
    .delete(requireBuilderAuth, validateRequest(builderValidation.deleteEndpoint), BuilderEndpointController.remove)
    .all(methodNotAllowed('PATCH', 'DELETE'));

export const BuilderRoutes = router;
