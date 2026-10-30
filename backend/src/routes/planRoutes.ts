import { Router } from 'express';
import {
  generateRequirements,
  generateSchema,
  generateApis,
  generateSprintPlan,
  getAllPlans,
  getPlanById,
} from '../controllers/planController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All plan routes require authentication
router.use(protect);

// AI Generator routes
router.post('/generate-requirements', generateRequirements);
router.post('/generate-schema',       generateSchema);
router.post('/generate-apis',         generateApis);
router.post('/generate-sprint-plan',  generateSprintPlan);

// History / Dashboard routes
router.get('/plans',     getAllPlans);
router.get('/plans/:id', getPlanById);

export default router;
