import express from 'express';
import { MockRuntimeController } from './mockRuntime.controller';

const router = express.Router({ mergeParams: true });

// Mounted at /api/v1/mock-apis/:projectId — handle every remaining path and method.
router.use(MockRuntimeController.handle);

export const MockRuntimeRoutes = router;
