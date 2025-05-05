import { Router } from 'express';
import typescriptErrorsRoutes from './admin/typescript-errors';

// Create main router
const router = Router();

// Mount admin routes
router.use('/api/admin/typescript-errors', typescriptErrorsRoutes);

export default router;