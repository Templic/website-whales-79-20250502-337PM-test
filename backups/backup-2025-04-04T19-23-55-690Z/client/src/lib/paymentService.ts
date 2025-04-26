import { apiRequest } from './queryClient';

interface PaymentIntentResponse {
  clientSecret: string;
}

interface PaymentInfo {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Creates a payment intent on the server
 */
export async function createPaymentIntent(paymentInfo: PaymentInfo): Promise<PaymentIntentResponse> {
  try {
    const response = await apiRequest('/api/payments/create-intent', {
      method: 'POST',
      data: paymentInfo
    });
    
    return response as PaymentIntentResponse;
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error);
    throw new Error(error.message || 'Failed to create payment intent');
  }
}

/**
 * Confirms a payment with the server
 */
export async function confirmPayment(
  paymentMethodId: string, 
  orderId: string
): Promise<{ success: boolean; order: any }> {
  try {
    const response = await apiRequest('/api/payments/confirm', {
      method: 'POST',
      data: {
        paymentMethodId,
        orderId
      }
    });
    
    return response;
  } catch (error: unknown) {
    console.error('Error confirming payment:', error);
    throw new Error(error.message || 'Failed to confirm payment');
  }
}

/**
 * Processes a complete order with payment
 */
export async function processOrder(orderData: unknown, 
  paymentMethodId: string
): Promise<{ success: boolean; orderId: string }> {
  try {
    const response = await apiRequest('/api/orders', {
      method: 'POST',
      data: {
        ...orderData,
        paymentMethodId
      }
    });
    
    return response;
  } catch (error: unknown) {
    console.error('Error processing order:', error);
    throw new Error(error.message || 'Failed to process order');
  }
}