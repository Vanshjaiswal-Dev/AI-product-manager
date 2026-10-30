import { Router } from 'express';
import {
  generateFullPlan,
  generateRequirements,
  generateSchema,
  generateApis,
  generateSprintPlan,
  getAllPlans,
  getPlanById,
} from '../controllers/planController';
import { protect } from '../middleware/authMiddleware';
import { generationLimiter } from '../middleware/rateLimiter';

const router = Router();

// All plan routes require authentication
router.use(protect);

// AI Generator routes — rate limited (5 req / 10 min per IP)
router.post('/generate-full-plan',    generationLimiter, generateFullPlan);
router.post('/generate-requirements', generationLimiter, generateRequirements);
router.post('/generate-schema',       generationLimiter, generateSchema);
router.post('/generate-apis',         generationLimiter, generateApis);
router.post('/generate-sprint-plan',  generationLimiter, generateSprintPlan);

// History / Dashboard routes
router.get('/plans',     getAllPlans);
router.get('/plans/:id', getPlanById);

export default router;
