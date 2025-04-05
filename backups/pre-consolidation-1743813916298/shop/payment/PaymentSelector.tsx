import { CreditCard, CreditCardIcon, DollarSign, Bitcoin, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentSelectorProps {
  paymentType: string;
  onValueChange: (value: string) => void;
}

const PaymentSelector = ({ paymentType, onValueChange }: PaymentSelectorProps) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-4 cosmic-gradient-text">Select Payment Method</h3>
      <Tabs defaultValue={paymentType} onValueChange={onValueChange} className="w-full">
        <TabsList className="cosmic-glass-panel grid grid-cols-5 h-auto p-1">
          <TabsTrigger value="stripe" className="cosmic-hover-glow data-[state=active]:bg-cosmic-primary/20 py-2">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Stripe</span>
          </TabsTrigger>
          <TabsTrigger value="paypal" className="cosmic-hover-glow data-[state=active]:bg-cosmic-primary/20 py-2">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PayPal</span>
          </TabsTrigger>
          <TabsTrigger value="bitpay" className="cosmic-hover-glow data-[state=active]:bg-cosmic-primary/20 py-2">
            <Bitcoin className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">BitPay</span>
          </TabsTrigger>
          <TabsTrigger value="opennode" className="cosmic-hover-glow data-[state=active]:bg-cosmic-primary/20 py-2">
            <Bitcoin className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">OpenNode</span>
          </TabsTrigger>
          <TabsTrigger value="coinbase" className="cosmic-hover-glow data-[state=active]:bg-cosmic-primary/20 py-2">
            <Wallet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Coinbase</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="cosmic-glass-panel p-4 mt-4 rounded-lg border border-cosmic-primary/20">
          <TabsContent value="stripe" className="pt-2 space-y-4">
            <div className="flex items-center gap-2 text-cosmic-primary">
              <CreditCard className="h-5 w-5" />
              <span>Secure credit card payment with Stripe</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pay securely with your credit or debit card through Stripe's encrypted payment system.
            </p>
          </TabsContent>
          
          <TabsContent value="paypal" className="pt-2 space-y-4">
            <div className="flex items-center gap-2 text-cosmic-primary opacity-60">
              <DollarSign className="h-5 w-5" />
              <span>Pay with your PayPal account</span>
            </div>
            <p className="text-sm text-muted-foreground">
              PayPal integration coming soon - currently in development.
            </p>
          </TabsContent>
          
          <TabsContent value="bitpay" className="pt-2 space-y-4">
            <div className="flex items-center gap-2 text-cosmic-primary opacity-60">
              <Bitcoin className="h-5 w-5" />
              <span>Crypto payment with BitPay</span>
            </div>
            <p className="text-sm text-muted-foreground">
              BitPay integration coming soon - currently in development.
            </p>
          </TabsContent>
          
          <TabsContent value="opennode" className="pt-2 space-y-4">
            <div className="flex items-center gap-2 text-cosmic-primary opacity-60">
              <Bitcoin className="h-5 w-5" />
              <span>Bitcoin payment with OpenNode</span>
            </div>
            <p className="text-sm text-muted-foreground">
              OpenNode integration coming soon - currently in development.
            </p>
          </TabsContent>
          
          <TabsContent value="coinbase" className="pt-2 space-y-4">
            <div className="flex items-center gap-2 text-cosmic-primary opacity-60">
              <Wallet className="h-5 w-5" />
              <span>Crypto payment with Coinbase</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Coinbase integration coming soon - currently in development.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PaymentSelector;