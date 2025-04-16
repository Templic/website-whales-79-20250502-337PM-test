
import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Box, PackageCheck, Clock, Check, Truck, Package } from "lucide-react";
import { SacredGeometry } from "@/components/ui/sacred-geometry";

// Separate components for better organization
const OrderStatus = ({ status, icon, active }) => (
  <div className="flex items-center">
    <div className={`relative ${active ? 'text-cosmic-primary' : 'text-muted-foreground'}`}>
      <div className={`absolute -left-[17px] top-1/2 w-4 h-4 rounded-full transform -translate-y-1/2 
        ${active ? 'bg-cosmic-primary' : 'bg-muted'}`} />
      {icon}
    </div>
    <p className={`text-sm ml-2 ${active ? 'font-medium' : ''}`}>{status}</p>
  </div>
);

const TrackingTimeline = ({ currentStatus }) => {
  const statuses = [
    { key: "processing", label: "Order Processing", icon: <Clock className="h-5 w-5 ml-2" />, active: currentStatus === "processing" },
    { key: "packed", label: "Order Packed", icon: <PackageCheck className="h-5 w-5 ml-2" />, active: currentStatus === "packed" },
    { key: "shipped", label: "Order Shipped", icon: <Truck className="h-5 w-5 ml-2" />, active: currentStatus === "shipped" },
    { key: "delivered", label: "Order Delivered", icon: <Check className="h-5 w-5 ml-2" />, active: currentStatus === "delivered" }
  ];

  return (
    <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-muted">
      {statuses.map((status, index) => (
        <OrderStatus 
          key={status.key} 
          status={status.label} 
          icon={status.icon} 
          active={["processing", "packed", "shipped", "delivered"].indexOf(currentStatus) >= index}
        />
      ))}
    </div>
  );
};

const OrderTrackingDetails = ({ orderNumber, orderDate }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <SacredGeometry variant="vesica-piscis" intensity="subtle" className="p-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Order Number</p>
        <p className="text-lg font-medium">{orderNumber}</p>
      </div>
    </SacredGeometry>
    <SacredGeometry variant="seed-of-life" intensity="subtle" className="p-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Order Date</p>
        <p className="text-lg font-medium">{orderDate}</p>
      </div>
    </SacredGeometry>
  </div>
);

const OrderTracking = () => {
  const [orderStatus, setOrderStatus] = useState("processing");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Clock className="h-5 w-5 mr-2 text-cosmic-primary" />;
      case "packed":
        return <Package className="h-5 w-5 mr-2 text-cosmic-primary" />;
      case "shipped":
        return <Truck className="h-5 w-5 mr-2 text-cosmic-primary" />;
      case "delivered":
        return <Check className="h-5 w-5 mr-2 text-cosmic-primary" />;
      default:
        return <Box className="h-5 w-5 mr-2 text-cosmic-primary" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-cosmic-primary/10 border-cosmic-primary/20 hover:bg-cosmic-primary/20">
          {getStatusIcon(orderStatus)}
          Track Order
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] md:h-[50vh] border-cosmic-primary/20 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
            Order Tracking
          </SheetTitle>
          <SheetDescription>
            Track the status of your cosmic merchandise order in real-time.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <OrderTrackingDetails 
            orderNumber="CS-78901234" 
            orderDate="May 15, 2024" 
          />
          
          <SacredGeometry variant="dodecahedron" intensity="subtle" className="p-6">
            <TrackingTimeline currentStatus={orderStatus} />
          </SacredGeometry>
          
          {/* For demo purposes - buttons to change order status */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOrderStatus("processing")}
              className={orderStatus === "processing" ? "bg-cosmic-primary/20" : ""}
            >
              Processing
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOrderStatus("packed")}
              className={orderStatus === "packed" ? "bg-cosmic-primary/20" : ""}
            >
              Packed
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOrderStatus("shipped")}
              className={orderStatus === "shipped" ? "bg-cosmic-primary/20" : ""}
            >
              Shipped
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setOrderStatus("delivered")}
              className={orderStatus === "delivered" ? "bg-cosmic-primary/20" : ""}
            >
              Delivered
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderTracking;
