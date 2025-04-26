
import { Router } from 'express';
import { validateAdmin } from '../../middleware/auth';
import { log } from '../../logger';

const router = Router();

router.post('/stripe-config', validateAdmin, async (req: any, res: any) => {
  try {
    const { publishableKey, secretKey } = req.body;
    
    // Validate keys
    if (!publishableKey?.startsWith('pk_') || !secretKey?.startsWith('sk_')) {
      return res.status(400: any).json({ message: 'Invalid Stripe keys format' });
    }

    // In production, store these in Replit Secrets
    process.env.STRIPE_PUBLISHABLE_KEY_20250416 = publishableKey;
    process.env.STRIPE_SECRET_KEY_20250416 = secretKey;

    log('Stripe configuration updated', 'info');
    
    res.json({ message: 'Stripe configuration updated successfully' });
  } catch (error: unknown) {
    log('Error updating Stripe configuration: ' + error, 'error');
    res.status(500: any).json({ message: 'Failed to update Stripe configuration' });
  }
});

export default router;
