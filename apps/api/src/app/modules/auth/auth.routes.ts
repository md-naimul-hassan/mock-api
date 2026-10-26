import express from 'express';
import auth from '../../middlewares/auth';
import methodNotAllowed from '../../middlewares/methodNotAllowed';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
const router = express.Router();

router.route('/login').post(validateRequest(AuthValidation.login), AuthController.login).all(methodNotAllowed('POST'));
router.route('/register').post(validateRequest(AuthValidation.register), AuthController.register).all(methodNotAllowed('POST'));
router.route('/refresh').post(validateRequest(AuthValidation.refresh), AuthController.refresh).all(methodNotAllowed('POST'));
router.route('/me').get(auth(), validateRequest(AuthValidation.me), AuthController.me).all(methodNotAllowed('GET'));
router.route('/admin').get(auth('admin'), validateRequest(AuthValidation.me), AuthController.admin).all(methodNotAllowed('GET'));

export const AuthRoutes = router;
