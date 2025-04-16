import express, { Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import paymentTransactionLogger, { PaymentTransactionType } from './security/paymentTransactionLogger';

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

    // Log payment intent creation (PCI DSS Requirement 10.2)
    paymentTransactionLogger.logTransaction({
      timestamp: new Date().toISOString(),
      transaction_id: paymentIntent.id,
      user_id: metadata?.userId,
      payment_gateway: 'stripe',
      transaction_type: 'intent_created',
      amount,
      currency,
      status: 'created',
      message: 'Payment intent created successfully',
      meta: metadata
    });

    // Return client secret to frontend
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    // Log payment error (PCI DSS Requirement 10.2)
    paymentTransactionLogger.logFailedPayment({
      transactionId: `failed_${Date.now()}`,
      gateway: 'stripe',
      amount: req.body?.amount || 0,
      currency: req.body?.currency || 'usd',
      errorMessage: error.message || 'Unknown error',
      meta: {
        errorCode: error.code,
        metadata: req.body?.metadata
      }
    });
    
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
    
    // For simulation purposes, we'll create a mock order
    const mockOrder = {
      id: orderId,
      amount: 2500, // This would come from the database in a real app
      currency: 'usd',
      status: 'paid',
      paymentId: paymentMethodId,
    };
    
    // Log successful payment (PCI DSS Requirement 10.2)
    paymentLogger.logPaymentSucceeded(
      'stripe',
      paymentMethodId,
      mockOrder.amount,
      mockOrder.currency,
      req.body.userId,
      req.body.email,
      orderId
    );
    
    // Return the mock order
    return res.json({
      success: true,
      order: mockOrder,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    
    // Log payment failure (PCI DSS Requirement 10.2)
    paymentLogger.logPaymentFailed(
      'stripe',
      req.body.paymentMethodId || 'unknown',
      req.body.amount || 0,
      req.body.currency || 'usd',
      error.code,
      error.message || 'Unknown error',
      req.body.userId,
      req.body.email,
      req.body.orderId || 'unknown'
    );
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
});

export default router;