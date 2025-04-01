import { useState, useEffect, useRef } from "react";
import { 
  Pencil, 
  Eraser, 
  Undo2, 
  Save, 
  RotateCcw, 
  Share2, 
  Download,
  Shapes,
  Palette,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SacredGeometry } from "@/components/ui/sacred-geometry";

const ColorPalette = ({ currentColor, onColorChange }) => {
  const colors = [
    "#9b87f5", // Cosmic primary
    "#7E69AB", // Secondary purple
    "#6E59A5", // Tertiary purple
    "#D6BCFA", // Light purple
    "#33C3F0", // Sky blue
    "#F97316", // Bright orange
    "#D946EF", // Magenta pink
    "#ffffff", // White
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          className={`w-8 h-8 rounded-full border-2 ${
            currentColor === color ? "border-white" : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onColorChange(color)}
        />
      ))}
    </div>
  );
};

const ShapeSelector = ({ onAddShape }) => {
  const shapes = [
    { name: "Circle", path: "M 50 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" },
    { name: "Square", path: "M 10 10 H 90 V 90 H 10 Z" },
    { name: "Triangle", path: "M 50 10 L 90 90 L 10 90 Z" },
    { name: "Star", path: "M 50 10 L 61 39 L 92 39 L 67 59 L 78 90 L 50 70 L 22 90 L 33 59 L 8 39 L 39 39 Z" },
    { name: "Hexagon", path: "M 50 10 L 90 35 L 90 65 L 50 90 L 10 65 L 10 35 Z" },
    { name: "Pentagon", path: "M 50 10 L 90 40 L 80 85 L 20 85 L 10 40 Z" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {shapes.map((shape) => (
        <button
          key={shape.name}
          className="p-2 border border-cosmic-primary/30 rounded hover:bg-cosmic-primary/10"
          onClick={() => onAddShape(shape.path)}
        >
          <svg width="40" height="40" viewBox="0 0 100 100">
            <path d={shape.path} fill="var(--cosmic-primary)" />
          </svg>
          <p className="text-xs mt-1">{shape.name}</p>
        </button>
      ))}
    </div>
  );
};

const CanvasControls = ({ 
  currentTool, 
  setCurrentTool, 
  currentColor,
  setCurrentColor,
  onClear, 
  onUndo, 
  onSave,
  onAddShape 
}) => {
  const [showColors, setShowColors] = useState(false);
  const [showShapes, setShowShapes] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        size="icon"
        variant={currentTool === "pencil" ? "default" : "outline"}
        onClick={() => setCurrentTool("pencil")}
        className="w-10 h-10"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant={currentTool === "eraser" ? "default" : "outline"}
        onClick={() => setCurrentTool("eraser")}
        className="w-10 h-10"
      >
        <Eraser className="h-4 w-4" />
      </Button>
      
      <Button
        size="icon"
        variant="outline"
        onClick={() => setShowColors(!showColors)}
        className="w-10 h-10"
        style={{ backgroundColor: currentColor }}
      >
        <Palette className="h-4 w-4" color={currentColor === '#ffffff' ? '#000' : '#fff'} />
      </Button>
      
      <Button
        size="icon"
        variant="outline"
        onClick={() => setShowShapes(!showShapes)}
        className="w-10 h-10"
      >
        <Shapes className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="outline"
        onClick={onUndo}
        className="w-10 h-10"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      
      <Button
        size="icon"
        variant="outline"
        onClick={onClear}
        className="w-10 h-10"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        size="icon"
        variant="outline"
        onClick={onSave}
        className="w-10 h-10"
      >
        <Save className="h-4 w-4" />
      </Button>
      
      {showColors && (
        <div className="absolute mt-12 p-2 bg-card/95 backdrop-blur-md border border-border rounded-md shadow-lg z-10">
          <ColorPalette 
            currentColor={currentColor} 
            onColorChange={(color) => {
              setCurrentColor(color);
              setShowColors(false);
            }} 
          />
        </div>
      )}
      
      {showShapes && (
        <div className="absolute mt-12 p-2 bg-card/95 backdrop-blur-md border border-border rounded-md shadow-lg z-10 w-[200px]">
          <ShapeSelector onAddShape={(path) => {
            onAddShape(path);
            setShowShapes(false);
          }} />
        </div>
      )}
    </div>
  );
};

const CollaboratorsList = ({ collaborators }) => {
  return (
    <div className="flex -space-x-2 overflow-hidden">
      {collaborators.map((person) => (
        <div 
          key={person.id}
          className="inline-block h-8 w-8 rounded-full border-2 border-background"
          title={person.name}
        >
          <img 
            src={person.avatar} 
            alt={person.name} 
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

const ShareDesignDialog = ({ isOpen, onClose, onShare }) => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleShare = () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to share with.",
        variant: "destructive",
      });
      return;
    }
    
    onShare(email);
    setEmail("");
    onClose();
    
    toast({
      title: "Design shared",
      description: `Your design has been shared with ${email}`,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Design</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleShare}>Share</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DesignTemplateSelector = ({ onSelectTemplate }) => {
  const templates = [
    { id: 1, name: "T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: 2, name: "Mug", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: 3, name: "Poster", image: "https://images.unsplash.com/photo-1616628188539-6d43a91fc474?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: 4, name: "Cap", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {templates.map((template) => (
        <div 
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className="cursor-pointer rounded-lg overflow-hidden border border-cosmic-primary/30 hover:border-cosmic-primary/70 transition-all"
        >
          <img 
            src={template.image} 
            alt={template.name}
            className="w-full h-32 object-cover" 
          />
          <p className="text-sm p-2 text-center">{template.name}</p>
        </div>
      ))}
    </div>
  );
};

const CoDesignStudio = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState("pencil");
  const [currentColor, setCurrentColor] = useState("#9b87f5");
  const [history, setHistory] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const collaborators = [
    { id: 1, name: "Alex Johnson", avatar: "https://api.dicebear.com/7.x/personas/svg?seed=Alex" },
    { id: 2, name: "Maria Garcia", avatar: "https://api.dicebear.com/7.x/personas/svg?seed=Maria" },
    { id: 3, name: "Sam Taylor", avatar: "https://api.dicebear.com/7.x/personas/svg?seed=Sam" },
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    
    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = currentColor;
    context.lineWidth = 5;
    contextRef.current = context;
    
    // Save initial blank canvas
    saveToHistory();
  }, []);
  
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = currentColor;
    }
  }, [currentColor]);
  
  const saveToHistory = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    setHistory((prev) => [...prev, canvas.toDataURL()]);
  };
  
  const startDrawing = ({ nativeEvent }) => {
    if (!contextRef.current) return;
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };
  
  const finishDrawing = () => {
    if (!contextRef.current || !isDrawing) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
    saveToHistory();
  };
  
  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !contextRef.current) return;
    
    const { offsetX, offsetY } = nativeEvent;
    
    if (currentTool === "pencil") {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    } else if (currentTool === "eraser") {
      contextRef.current.save();
      contextRef.current.globalCompositeOperation = "destination-out";
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      contextRef.current.restore();
    }
  };
  
  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    contextRef.current.clearRect(
      0, 
      0, 
      canvasRef.current.width, 
      canvasRef.current.height
    );
    saveToHistory();
  };
  
  const undo = () => {
    if (history.length < 2 || !contextRef.current || !canvasRef.current) return;
    
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    
    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      contextRef.current.clearRect(
        0, 
        0, 
        canvasRef.current.width, 
        canvasRef.current.height
      );
      contextRef.current.drawImage(
        img, 
        0, 
        0, 
        canvasRef.current.width / 2, 
        canvasRef.current.height / 2
      );
    };
  };
  
  const saveDesign = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = "cosmic-design.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    
    toast({
      title: "Design saved",
      description: "Your design has been downloaded to your device.",
    });
  };

  const addShape = (path) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    
    ctx.save();
    ctx.fillStyle = currentColor;
    
    const svgPath = new Path2D(path);
    // Scale and position the shape in the center of the canvas
    ctx.translate(canvas.width / 4 - 50, canvas.height / 4 - 50);
    ctx.fill(svgPath);
    ctx.restore();
    
    saveToHistory();
  };

  const handleShareDesign = (email) => {
    // In a real app, this would send the design to the specified email
    console.log(`Sharing design with ${email}`);
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    
    // In a real app, this would load the template image onto the canvas
    toast({
      title: `${template.name} template selected`,
      description: "You can now start designing your product.",
    });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-cosmic-primary/10 border-cosmic-primary/20 hover:bg-cosmic-primary/20">
          <Plus className="h-4 w-4 mr-2" />
          Co-Design Products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shapes className="h-5 w-5 text-cosmic-primary" />
            Cosmic Co-Design Studio
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="design">Design Canvas</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="design" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Design Controls</h3>
                <CanvasControls 
                  currentTool={currentTool}
                  setCurrentTool={setCurrentTool}
                  currentColor={currentColor}
                  setCurrentColor={setCurrentColor}
                  onClear={clearCanvas}
                  onUndo={undo}
                  onSave={saveDesign}
                  onAddShape={addShape}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Collaborating with</h3>
                  <CollaboratorsList collaborators={collaborators} />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
            </div>
            
            <SacredGeometry variant="torus" intensity="subtle" className="p-2 h-[400px] relative">
              {selectedTemplate && (
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                  <img
                    src={selectedTemplate.image}
                    alt={selectedTemplate.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                onMouseLeave={finishDrawing}
                className="w-full h-full bg-white/5 backdrop-blur-sm rounded-lg cursor-crosshair"
              />
            </SacredGeometry>
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={saveDesign}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button>
                Save Design
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="templates">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select a Template</h3>
              <p className="text-sm text-muted-foreground">
                Choose a product template to start designing. Your design will be applied to the selected product.
              </p>
              
              <DesignTemplateSelector onSelectTemplate={selectTemplate} />
            </div>
          </TabsContent>
        </Tabs>

        <ShareDesignDialog 
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          onShare={handleShareDesign}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CoDesignStudio;
