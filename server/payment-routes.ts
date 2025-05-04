import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import paymentTransactionLogger, { PaymentTransactionType, PaymentTransactionStatus } from './security/paymentTransactionLogger';
import { csrfProtection } from './security/middleware/csrfProtection';
import { pciComplianceMiddleware } from './security/middleware/pciCompliance';
import { recordAuditEvent } from './security/secureAuditTrail';
import { getClientIPFromRequest, redactSensitiveInfo } from './utils/security';
import { PaymentOperationType } from './security/PaymentAccessControl';

const router = express.Router();

// Apply PCI compliance middleware to all payment routes
router.use(pciComplianceMiddleware); // Apply security headers and sanitization

// Helper function to get client IP for transaction logging (PCI DSS Req 10.3.1)
function getClientIP(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Initialize Stripe
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
if (!stripeApiKey) {
  recordAuditEvent({
    timestamp: new Date().toISOString(),
    action: 'PAYMENT_CONFIGURATION_ERROR',
    resource: 'stripe:api_key',
    result: 'failure',
    severity: 'critical',
    details: {
      error: 'Stripe API key not configured',
      startup: true
    }
  });
  throw new Error('Stripe secret key is required. Please check environment variables.');
}

// Type assertion to fix apiVersion compatibility issue
const apiVersion = '2023-10-16' as any;
const stripe = new Stripe(stripeApiKey, {
  apiVersion
});

// Schema for validating payment intent request
const paymentIntentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().default('usd'),
  metadata: z.record(z.string()).optional(),
});

// Helper function to initialize Stripe
function getStripeClient(): Stripe {
  if (!stripeApiKey) {
    throw new Error('Stripe API key is not configured');
  }
  return new Stripe(stripeApiKey, { apiVersion: apiVersion });
}

// Create payment intent
router.post('/create-intent', csrfProtection(), async (req: Request, res: Response) => {
  try {
    // Check if Stripe API key is available
    if (!stripeApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Stripe API key is not configured'
      });
    }

    // Initialize Stripe
    const stripeClient = getStripeClient();

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
    
    // Get client IP for audit trail (PCI DSS Req 10.3.1)
    const clientIp = getClientIP(req);
    const userId = metadata?.userId || req.user?.id;

    // Create payment intent with Stripe
    const paymentIntent = await stripeClient.paymentIntents.create({
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
      user_id: userId,
      ip_address: clientIp,
      payment_gateway: 'stripe',
      transaction_type: 'intent_created',
      amount,
      currency,
      status: 'created',
      message: 'Payment intent created successfully',
      meta: metadata
    });

    // Return client secret to frontend (PCI DSS compliant - only sending client_secret, not the full API key)
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) { // Type assertion to fix type errors
    console.error('Error creating payment intent:', error);
    
    // Get client IP for audit trail
    const clientIp = getClientIP(req);
    const userId = req.body?.metadata?.userId || req.user?.id;
    
    // Log payment error (PCI DSS Requirement 10.2)
    paymentTransactionLogger.logFailedPayment({
      transactionId: `failed_${Date.now()}`,
      gateway: 'stripe',
      amount: req.body?.amount || 0,
      currency: req.body?.currency || 'usd',
      errorMessage: error?.message || 'Unknown error',
      errorCode: error?.code,
      userId: userId,
      ipAddress: clientIp,
      meta: {
        metadata: req.body?.metadata
      }
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent. Please try again later.',
    });
  }
});

// Confirm payment
router.post('/confirm', csrfProtection(), async (req: Request, res: Response) => {
  try {
    // Check if Stripe API key is available
    if (!stripeApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Stripe API key is not configured'
      });
    }

    // Initialize Stripe
    const stripeClient = getStripeClient();

    const { paymentMethodId, orderId } = req.body;

    if (!paymentMethodId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID and order ID are required',
      });
    }
    
    // Get client IP for audit trail (PCI DSS Req 10.3.1)
    const clientIp = getClientIP(req);
    const userId = req.body?.userId || req.user?.id;

    // In a real application, you would retrieve the order from the database
    // and validate that it exists and the payment status is appropriate
    
    // For simulation purposes, we'll create a sample record based on payment confirmation
    // that would typically come from your database in a production system
    const confirmedPayment = {
      id: orderId,
      amount: 2500, // In a real app, this would come from your database
      currency: 'usd',
      status: 'paid',
      paymentId: paymentMethodId,
    };
    
    // Record this confirmation in the audit trail for PCI compliance
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_CONFIRMATION',
      resource: `payment:${paymentMethodId}`,
      userId: userId,
      ipAddress: clientIp,
      result: 'success',
      severity: 'info',
      details: {
        orderId,
        amount: confirmedPayment.amount,
        currency: confirmedPayment.currency
      }
    });
    
    // Log successful payment (PCI DSS Requirement 10.2)
    paymentTransactionLogger.logSuccessfulPayment({
      transactionId: paymentMethodId,
      orderId,
      userId: userId as string,
      gateway: 'stripe',
      amount: confirmedPayment.amount,
      currency: confirmedPayment.currency,
      last4: req.body.last4,
      ipAddress: clientIp,
      meta: {
        email: req.body.email ? '[REDACTED EMAIL]' : undefined // Redact for PCI compliance
      }
    });
    
    // Return the confirmation
    return res.json({
      success: true,
      order: confirmedPayment,
    });
  } catch (error: any) { // Type assertion for error handling
    console.error('Error confirming payment:', error);
    
    // Get client IP for audit trail
    const clientIp = getClientIP(req);
    const userId = req.body?.userId || req.user?.id;
    
    // Log this error in the audit trail (PCI DSS Req 10.2)
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_CONFIRMATION_ERROR',
      resource: `payment:${req.body.paymentMethodId || 'unknown'}`,
      userId: userId,
      ipAddress: clientIp,
      result: 'failure',
      severity: 'warning',
      details: {
        error: error?.message || 'Unknown error',
        orderId: req.body.orderId || 'unknown'
      }
    });
    
    // Log payment failure (PCI DSS Requirement 10.2)
    paymentTransactionLogger.logFailedPayment({
      transactionId: req.body.paymentMethodId || `failed_${Date.now()}`,
      orderId: req.body.orderId,
      userId: userId as string,
      gateway: 'stripe',
      amount: req.body.amount ? Number(req.body.amount) : 0, // Convert to number 
      currency: req.body.currency || 'usd',
      errorMessage: error?.message || 'Unknown error',
      errorCode: error?.code,
      ipAddress: clientIp,
      meta: {
        email: req.body.email ? '[REDACTED EMAIL]' : undefined // Redact for PCI compliance
      }
    });
    
    // Return a generic error to client (don't expose internal details - PCI DSS Req 6.5.5)
    return res.status(500).json({
      success: false,
      message: 'Payment confirmation failed. Please contact customer support.',
    });
  }
});

export default router;