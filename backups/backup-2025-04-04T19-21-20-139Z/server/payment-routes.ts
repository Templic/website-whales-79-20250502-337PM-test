import express, { Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';

const router = express.Router();

// Initialize Stripe
const stripeApiKey = process.env.STRIPE_SECRET_KEY;

// Schema for validating payment intent request
const paymentIntentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().default('usd'),
  metadata: z.record(z.string()).optional(),
});

// Helper function to initialize Stripe
function getStripeClient() {
  if (!stripeApiKey) {
    throw new Error('Stripe API key is not configured');
  }
  return new Stripe(stripeApiKey);
}

// Create payment intent
router.post('/create-intent', async (req: Request, res: Response) => {
  try {
    // Check if Stripe API key is available
    if (!stripeApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Stripe API key is not configured'
      });
    }

    // Initialize Stripe
    const stripe = getStripeClient();

    // Validate request data
    const validationResult = paymentIntentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid payment data',
        errors: validationResult.error.errors 
      });
    }

    const { amount, currency, metadata } = validationResult.data;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return client secret to frontend
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error$2 {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
});

// Confirm payment
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    // Check if Stripe API key is available
    if (!stripeApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Stripe API key is not configured'
      });
    }

    // Initialize Stripe
    const stripe = getStripeClient();

    const { paymentMethodId, orderId } = req.body;

    if (!paymentMethodId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID and order ID are required',
      });
    }

    // In a real application, you would retrieve the order from the database
    // and validate that it exists and the payment status is appropriate
    
    // Mock confirmation response for now
    return res.json({
      success: true,
      order: {
        id: orderId,
        status: 'paid',
        paymentId: paymentMethodId,
      },
    });
  } catch (error$2 {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
});

export default router;