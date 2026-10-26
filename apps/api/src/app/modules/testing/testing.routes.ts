import express from 'express';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { TestingController } from './testing.controller';
import { TestingValidation } from './testing.validation';
const router = express.Router();

router.route('/echo').post(TestingController.echo).all(methodNotAllowed('POST'));
router.route('/delay').get(validateRequest(TestingValidation.delay), TestingController.delay).all(methodNotAllowed('GET'));
router.route('/status/:code').get(validateRequest(TestingValidation.status), TestingController.status).all(methodNotAllowed('GET'));

export const TestingRoutes = router;
