
import { CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentSelectorProps {
  paymentType: string;
  onValueChange: (value: string) => void;
}

const PaymentSelector = ({ paymentType, onValueChange }: PaymentSelectorProps) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
      <Tabs defaultValue={paymentType} onValueChange={onValueChange} className="w-full">
        <TabsList>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
          <TabsTrigger value="bitpay">BitPay</TabsTrigger>
          <TabsTrigger value="opennode">OpenNode</TabsTrigger>
          <TabsTrigger value="coinbase">Coinbase</TabsTrigger>
        </TabsList>
        <TabsContent value="stripe" className="pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cosmic-primary" />
            <span>Secure payment with Stripe</span>
          </div>
        </TabsContent>
        <TabsContent value="paypal" className="pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cosmic-primary" />
            <span>Secure payment with PayPal</span>
          </div>
        </TabsContent>
        <TabsContent value="bitpay" className="pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cosmic-primary" />
            <span>Crypto payment with BitPay</span>
          </div>
        </TabsContent>
        <TabsContent value="opennode" className="pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cosmic-primary" />
            <span>Bitcoin payment with OpenNode</span>
          </div>
        </TabsContent>
        <TabsContent value="coinbase" className="pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cosmic-primary" />
            <span>Crypto payment with Coinbase</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSelector;
