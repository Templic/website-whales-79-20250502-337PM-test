
import CollaborativeShopping from "./collaborative/CollaborativeShopping";
import CoDesignStudio from "./CoDesignStudio";
import { Product } from "@/pages/Shop";
import { SacredGeometry } from "@/components/ui/sacred-geometry";
import { Users, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnhancedShoppingProps {
  onProductView: (productId: string) => void;
  products: Product[];
}

const EnhancedShoppingFeature = ({
  icon,
  title,
  description,
  children,
  variant = "vesica-piscis"
}) => {
  return (
    <SacredGeometry variant={variant} intensity="subtle" className="flex flex-col items-center justify-center p-4 md:p-6">
      <div className="h-10 w-10 rounded-full bg-cosmic-primary/10 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2 text-center">{title}</h3>
      <p className="text-sm text-center text-muted-foreground mb-4">
        {description}
      </p>
      {children}
    </SacredGeometry>
  );
};

const EnhancedShopping = ({ onProductView, products }: EnhancedShoppingProps) => {
  const isMobile = useIsMobile();

  return (
    <SacredGeometry variant="dodecahedron" intensity="subtle" className="mb-8 p-4 md:p-6">
      <div className="mb-4 text-center md:text-left">
        <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
          Enhanced Shopping Experience
        </h2>
        <p className="text-sm text-muted-foreground">
          Collaborate with friends or design your own custom products
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-6 px-4 md:px-8">
        <EnhancedShoppingFeature
          icon={<Users className="h-6 w-6 text-cosmic-primary" />}
          title="Shop Together"
          description="Browse and shop with friends in real-time, share product recommendations, and make collective purchasing decisions"
          variant="vesica-piscis"
        >
          <CollaborativeShopping 
            onProductView={onProductView}
            products={products}
          />
        </EnhancedShoppingFeature>
        
        <EnhancedShoppingFeature
          icon={<Sparkles className="h-6 w-6 text-cosmic-primary" />}
          title="Co-Design Studio"
          description="Create and customize your own cosmic products with our interactive design tools, collaborate with others on design ideas"
          variant="seed-of-life"
        >
          <CoDesignStudio />
        </EnhancedShoppingFeature>
      </div>
    </SacredGeometry>
  );
};

export default EnhancedShopping;
