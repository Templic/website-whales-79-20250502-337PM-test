import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { ShoppingBag, CreditCard, MapPin, Truck, CheckCircle } from 'lucide-react';
import CosmicStepper from '../ui/cosmic-stepper';
import CosmicInput from '../ui/cosmic-input';
import CosmicButton from '../ui/cosmic-button';
import CosmicHeading from '../ui/cosmic-heading';
import CosmicCheckbox from '../ui/cosmic-checkbox';
import CosmicForm, { CosmicFormGroup, CosmicFormLabel, CosmicFormHelperText } from '../ui/cosmic-form';
import { formatCurrency } from '@/lib/utils';
import { CartItem, Product } from '@shared/schema';

// Form schemas
const billingSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address1: z.string().min(5, 'Address must be at least 5 characters'),
  address2: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
});

const shippingSchema = billingSchema;

const paymentSchema = z.object({
  cardName: z.string().min(2, 'Name on card must be at least 2 characters'),
  cardNumber: z
    .string()
    .min(15, 'Card number must be at least 15 digits')
    .max(19, 'Card number cannot exceed 19 digits')
    .refine((val) => /^[0-9]+$/.test(val), 'Card number must contain only digits'),
  expiryMonth: z
    .string()
    .refine((val) => /^(0[1-9]|1[0-2])$/.test(val), 'Invalid month'),
  expiryYear: z
    .string()
    .refine((val) => /^[0-9]{2}$/.test(val), 'Invalid year'),
  cvv: z
    .string()
    .min(3, 'CVV must be at least 3 digits')
    .max(4, 'CVV cannot exceed 4 digits')
    .refine((val) => /^[0-9]+$/.test(val), 'CVV must contain only digits'),
  savePaymentInfo: z.boolean().default(false),
});

export type BillingFormData = z.infer<typeof billingSchema>;
export type ShippingFormData = z.infer<typeof shippingSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;

export interface CheckoutFormProps {
  cartItems: (CartItem & { product: Product })[];
  onCheckoutComplete: (
    billingData: BillingFormData,
    shippingData: ShippingFormData,
    paymentData: PaymentFormData,
    orderNotes: string
  ) => Promise<void>;
  className?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  cartItems,
  onCheckoutComplete,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [billingData, setBillingData] = useState<BillingFormData | null>(null);
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Calculate order summary
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product.salePrice || item.product.price;
    return total + (Number(price) * item.quantity);
  }, 0);
  
  const shippingCost = 10.00; // Fixed shipping cost for demo
  const tax = subtotal * 0.08; // 8% tax for demo
  const total = subtotal + shippingCost + tax;

  // Billing form setup
  const billingForm = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  // Shipping form setup
  const shippingForm = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  // Payment form setup
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      savePaymentInfo: false,
    },
  });

  // Handle billing form submission
  const onBillingSubmit = (data: BillingFormData) => {
    setBillingData(data);
    
    // If same as billing is checked, copy billing data to shipping form
    if (sameAsBilling) {
      shippingForm.reset(data);
      setShippingData(data);
      setCurrentStep(2); // Skip shipping step
    } else {
      setCurrentStep(1); // Go to shipping step
    }
  };

  // Handle shipping form submission
  const onShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setCurrentStep(2); // Go to payment step
  };

  // Handle payment form submission
  const onPaymentSubmit = async (data: PaymentFormData) => {
    if (!billingData || (!sameAsBilling && !shippingData)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      await onCheckoutComplete(
        billingData,
        sameAsBilling ? billingData : (shippingData as ShippingFormData),
        data,
        orderNotes
      );
      setIsComplete(true);
      setCurrentStep(3); // Go to confirmation step
    } catch (error) {
      console.error('Checkout error:', error);
      // Handle checkout error
    } finally {
      setIsProcessing(false);
    }
  };

  // Update shipping form when "same as billing" changes
  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked && billingData) {
      shippingForm.reset(billingData);
    }
  };

  return (
    <div className={className}>
      <CosmicStepper
        variant="cosmic"
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        layout="expanded"
        steps={[
          {
            id: 'billing',
            title: 'Billing Information',
            description: 'Enter your billing details',
            content: (
              <div>
                <CosmicForm
                  form={billingForm}
                  onSubmit={onBillingSubmit}
                  className="space-y-4 mt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="firstName">First Name</CosmicFormLabel>
                      <CosmicInput
                        id="firstName"
                        {...billingForm.register('firstName')}
                        error={billingForm.formState.errors.firstName?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="lastName">Last Name</CosmicFormLabel>
                      <CosmicInput
                        id="lastName"
                        {...billingForm.register('lastName')}
                        error={billingForm.formState.errors.lastName?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="email">Email Address</CosmicFormLabel>
                      <CosmicInput
                        id="email"
                        type="email"
                        {...billingForm.register('email')}
                        error={billingForm.formState.errors.email?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="phone">Phone (Optional)</CosmicFormLabel>
                      <CosmicInput
                        id="phone"
                        {...billingForm.register('phone')}
                        error={billingForm.formState.errors.phone?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="address1">Address Line 1</CosmicFormLabel>
                    <CosmicInput
                      id="address1"
                      {...billingForm.register('address1')}
                      error={billingForm.formState.errors.address1?.message}
                    />
                  </CosmicFormGroup>
                  
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="address2">Address Line 2 (Optional)</CosmicFormLabel>
                    <CosmicInput
                      id="address2"
                      {...billingForm.register('address2')}
                      error={billingForm.formState.errors.address2?.message}
                    />
                  </CosmicFormGroup>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="city">City</CosmicFormLabel>
                      <CosmicInput
                        id="city"
                        {...billingForm.register('city')}
                        error={billingForm.formState.errors.city?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="state">State/Province</CosmicFormLabel>
                      <CosmicInput
                        id="state"
                        {...billingForm.register('state')}
                        error={billingForm.formState.errors.state?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="postalCode">Postal Code</CosmicFormLabel>
                      <CosmicInput
                        id="postalCode"
                        {...billingForm.register('postalCode')}
                        error={billingForm.formState.errors.postalCode?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="country">Country</CosmicFormLabel>
                      <select
                        id="country"
                        {...billingForm.register('country')}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-cosmic-primary"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="JP">Japan</option>
                      </select>
                      {billingForm.formState.errors.country && (
                        <CosmicFormHelperText error>
                          {billingForm.formState.errors.country.message}
                        </CosmicFormHelperText>
                      )}
                    </CosmicFormGroup>
                  </div>
                  
                  <div className="mt-4">
                    <CosmicCheckbox
                      id="sameAsBilling"
                      checked={sameAsBilling}
                      onCheckedChange={handleSameAsBillingChange}
                      label="Shipping address is same as billing"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <CosmicButton type="submit" variant="cosmic">
                      Continue to {sameAsBilling ? 'Payment' : 'Shipping'}
                    </CosmicButton>
                  </div>
                </CosmicForm>
              </div>
            ),
          },
          {
            id: 'shipping',
            title: 'Shipping Information',
            description: 'Enter your shipping details',
            content: (
              <div>
                <CosmicForm
                  form={shippingForm}
                  onSubmit={onShippingSubmit}
                  className="space-y-4 mt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-firstName">First Name</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-firstName"
                        {...shippingForm.register('firstName')}
                        error={shippingForm.formState.errors.firstName?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-lastName">Last Name</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-lastName"
                        {...shippingForm.register('lastName')}
                        error={shippingForm.formState.errors.lastName?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-email">Email Address</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-email"
                        type="email"
                        {...shippingForm.register('email')}
                        error={shippingForm.formState.errors.email?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-phone">Phone (Optional)</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-phone"
                        {...shippingForm.register('phone')}
                        error={shippingForm.formState.errors.phone?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="shipping-address1">Address Line 1</CosmicFormLabel>
                    <CosmicInput
                      id="shipping-address1"
                      {...shippingForm.register('address1')}
                      error={shippingForm.formState.errors.address1?.message}
                    />
                  </CosmicFormGroup>
                  
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="shipping-address2">Address Line 2 (Optional)</CosmicFormLabel>
                    <CosmicInput
                      id="shipping-address2"
                      {...shippingForm.register('address2')}
                      error={shippingForm.formState.errors.address2?.message}
                    />
                  </CosmicFormGroup>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-city">City</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-city"
                        {...shippingForm.register('city')}
                        error={shippingForm.formState.errors.city?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-state">State/Province</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-state"
                        {...shippingForm.register('state')}
                        error={shippingForm.formState.errors.state?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-postalCode">Postal Code</CosmicFormLabel>
                      <CosmicInput
                        id="shipping-postalCode"
                        {...shippingForm.register('postalCode')}
                        error={shippingForm.formState.errors.postalCode?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="shipping-country">Country</CosmicFormLabel>
                      <select
                        id="shipping-country"
                        {...shippingForm.register('country')}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-cosmic-primary"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="JP">Japan</option>
                      </select>
                      {shippingForm.formState.errors.country && (
                        <CosmicFormHelperText error>
                          {shippingForm.formState.errors.country.message}
                        </CosmicFormHelperText>
                      )}
                    </CosmicFormGroup>
                  </div>
                  
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="orderNotes">Order Notes (Optional)</CosmicFormLabel>
                    <textarea
                      id="orderNotes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Special delivery instructions or notes"
                      className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-cosmic-primary h-24 resize-none"
                    />
                  </CosmicFormGroup>
                  
                  <div className="mt-6 flex justify-between">
                    <CosmicButton
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                    >
                      Back to Billing
                    </CosmicButton>
                    
                    <CosmicButton type="submit" variant="cosmic">
                      Continue to Payment
                    </CosmicButton>
                  </div>
                </CosmicForm>
              </div>
            ),
          },
          {
            id: 'payment',
            title: 'Payment',
            description: 'Enter your payment details',
            content: (
              <div>
                <CosmicForm
                  form={paymentForm}
                  onSubmit={onPaymentSubmit}
                  className="space-y-4 mt-4"
                >
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="cardName">Name on Card</CosmicFormLabel>
                    <CosmicInput
                      id="cardName"
                      {...paymentForm.register('cardName')}
                      error={paymentForm.formState.errors.cardName?.message}
                    />
                  </CosmicFormGroup>
                  
                  <CosmicFormGroup>
                    <CosmicFormLabel htmlFor="cardNumber">Card Number</CosmicFormLabel>
                    <CosmicInput
                      id="cardNumber"
                      {...paymentForm.register('cardNumber')}
                      placeholder="XXXX XXXX XXXX XXXX"
                      error={paymentForm.formState.errors.cardNumber?.message}
                    />
                  </CosmicFormGroup>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="expiryMonth">Expiry Month</CosmicFormLabel>
                      <CosmicInput
                        id="expiryMonth"
                        {...paymentForm.register('expiryMonth')}
                        placeholder="MM"
                        error={paymentForm.formState.errors.expiryMonth?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="expiryYear">Expiry Year</CosmicFormLabel>
                      <CosmicInput
                        id="expiryYear"
                        {...paymentForm.register('expiryYear')}
                        placeholder="YY"
                        error={paymentForm.formState.errors.expiryYear?.message}
                      />
                    </CosmicFormGroup>
                    
                    <CosmicFormGroup>
                      <CosmicFormLabel htmlFor="cvv">CVV</CosmicFormLabel>
                      <CosmicInput
                        id="cvv"
                        type="password"
                        {...paymentForm.register('cvv')}
                        placeholder="XXX"
                        error={paymentForm.formState.errors.cvv?.message}
                      />
                    </CosmicFormGroup>
                  </div>
                  
                  <div className="mt-4">
                    <CosmicCheckbox
                      id="savePaymentInfo"
                      {...paymentForm.register('savePaymentInfo')}
                      label="Save payment information for future orders"
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <CosmicButton
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(sameAsBilling ? 0 : 1)}
                    >
                      Back
                    </CosmicButton>
                    
                    <CosmicButton 
                      type="submit" 
                      variant="cosmic"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Complete Order'}
                    </CosmicButton>
                  </div>
                </CosmicForm>
              </div>
            ),
          },
          {
            id: 'confirmation',
            title: 'Confirmation',
            description: 'Order completed',
            content: (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CosmicHeading as="h3" size="xl" className="mb-2">
                  Thank You For Your Order!
                </CosmicHeading>
                <p className="text-gray-400 mb-6">
                  Your order has been placed and is being processed. You will receive an email confirmation shortly.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
                  <CosmicHeading as="h4" size="sm" className="mb-2">
                    Order Summary
                  </CosmicHeading>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping:</span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax:</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center space-x-4">
                  <Link href="/shop">
                    <CosmicButton variant="outline">
                      Continue Shopping
                    </CosmicButton>
                  </Link>
                  <Link href="/account/orders">
                    <CosmicButton variant="cosmic">
                      View Order
                    </CosmicButton>
                  </Link>
                </div>
              </div>
            ),
          },
        ]}
      />
      
      {/* Order Summary Sidebar */}
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 mt-6">
        <CosmicHeading as="h3" size="lg" className="mb-4">
          Order Summary
        </CosmicHeading>
        
        <div className="space-y-4 mb-4">
          {cartItems.map((item) => {
            const product = item.product;
            const price = product.salePrice || product.price;
            const totalPrice = Number(price) * item.quantity;
            
            return (
              <div key={item.id} className="flex items-center border-b border-gray-800 pb-2">
                <div className="w-12 h-12 flex-shrink-0">
                  {Array.isArray(product.images) && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium">{product.name}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <span>{formatCurrency(Number(price))}</span>
                    <span className="mx-1">×</span>
                    <span>{item.quantity}</span>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(totalPrice)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping</span>
            <span>{formatCurrency(shippingCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-800 font-medium text-base">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;