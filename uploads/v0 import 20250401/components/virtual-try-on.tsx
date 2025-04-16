"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, RotateCcw, ShoppingCart, Shirt, Palette, Share2, Download, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface VirtualTryOnProps {
  productName: string
  productImage: string
  productColors: string[]
  productSizes: string[]
}

export function VirtualTryOn({
  productName = "Cosmic Healing Frequencies T-Shirt",
  productImage = "/placeholder.svg?height=600&width=600",
  productColors = ["Black", "Purple", "White"],
  productSizes = ["S", "M", "L", "XL", "XXL"],
}: VirtualTryOnProps) {
  const [activeTab, setActiveTab] = useState("try-on")
  const [selectedColor, setSelectedColor] = useState(productColors[0])
  const [selectedSize, setSelectedSize] = useState(productSizes[2])
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)
  const [currentModelIndex, setCurrentModelIndex] = useState(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Mock model images for demonstration
  const modelImages = [
    "/placeholder.svg?height=800&width=600",
    "/placeholder.svg?height=800&width=600",
    "/placeholder.svg?height=800&width=600",
  ]

  const getColorHex = (colorName: string) => {
    switch (colorName) {
      case "Black":
        return "#000000"
      case "Purple":
        return "#9333ea"
      case "White":
        return "#ffffff"
      case "Navy":
        return "#1e3a8a"
      case "Indigo":
        return "#4f46e5"
      default:
        return "#9333ea"
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Unable to access camera. Please make sure you've granted camera permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()

      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")

      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

        const imageDataUrl = canvasRef.current.toDataURL("image/png")
        setCapturedImage(imageDataUrl)
        stopCamera()

        // Simulate processing time for the AR try-on
        setTimeout(() => {
          // In a real app, this would be where you'd send the image to a backend
          // for processing with the virtual try-on model
          setTryOnResult(modelImages[currentModelIndex])
        }, 2000)
      }
    }
  }

  const resetCapture = () => {
    setCapturedImage(null)
    setTryOnResult(null)
  }

  const nextModel = () => {
    setCurrentModelIndex((prev) => (prev + 1) % modelImages.length)
    if (tryOnResult) {
      setTryOnResult(modelImages[(currentModelIndex + 1) % modelImages.length])
    }
  }

  const prevModel = () => {
    setCurrentModelIndex((prev) => (prev - 1 + modelImages.length) % modelImages.length)
    if (tryOnResult) {
      setTryOnResult(modelImages[(currentModelIndex - 1 + modelImages.length) % modelImages.length])
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white">{productName} - Virtual Try-On</h2>
      </div>

      <Tabs defaultValue="try-on" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="try-on"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Virtual Try-On
            </TabsTrigger>
            <TabsTrigger
              value="models"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              View on Models
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Product Details
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="try-on" className="p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="relative aspect-[3/4] bg-black/40 rounded-lg overflow-hidden">
                {!cameraActive && !capturedImage && !tryOnResult && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                      <Camera className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Virtual Try-On Experience</h3>
                    <p className="text-white/70 mb-6">
                      Use your camera to see how this product looks on you in real-time
                    </p>
                    <Button
                      onClick={startCamera}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera
                    </Button>
                  </div>
                )}

                {cameraActive && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <Button
                        onClick={captureImage}
                        className="bg-purple-500/80 hover:bg-purple-600/80 text-white backdrop-blur-sm"
                      >
                        Capture Image
                      </Button>
                    </div>
                  </>
                )}

                {capturedImage && !tryOnResult && (
                  <>
                    <Image src={capturedImage || "/placeholder.svg"} alt="Captured" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-4"></div>
                      <p className="text-white font-medium">Processing your image...</p>
                      <p className="text-white/70 text-sm">This may take a few moments</p>
                    </div>
                  </>
                )}

                {tryOnResult && (
                  <>
                    <Image
                      src={tryOnResult || "/placeholder.svg"}
                      alt="Virtual Try-On Result"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      <Button
                        onClick={resetCapture}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                      <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 backdrop-blur-sm">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Color</h3>
                  <div className="flex gap-3">
                    {productColors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2",
                          selectedColor === color ? "border-purple-400" : "border-transparent",
                        )}
                        style={{ backgroundColor: getColorHex(color) }}
                        aria-label={`Select ${color} color`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {productSizes.map((size, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "min-w-[3rem] rounded-md border px-3 py-2 text-sm",
                          selectedSize === size
                            ? "border-purple-400 bg-purple-400/10 text-white"
                            : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg bg-black/40 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shirt className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-medium text-white">How It Works</h3>
                </div>
                <ol className="space-y-4 text-white/80">
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-900/30 text-sm font-medium text-white">
                      1
                    </div>
                    <p>Click "Start Camera" to activate your device's camera</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-900/30 text-sm font-medium text-white">
                      2
                    </div>
                    <p>Position yourself in the frame and click "Capture Image"</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-900/30 text-sm font-medium text-white">
                      3
                    </div>
                    <p>Our AI will process your image and show how the product looks on you</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-900/30 text-sm font-medium text-white">
                      4
                    </div>
                    <p>Experiment with different colors and sizes to find your perfect match</p>
                  </li>
                </ol>
              </div>

              <div className="rounded-lg bg-black/40 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-medium text-white">Product Details</h3>
                </div>
                <div className="space-y-3 text-white/80">
                  <p>
                    This premium quality t-shirt features the Cosmic Healing Frequencies album artwork, printed with
                    eco-friendly inks on 100% organic cotton.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Relaxed unisex fit</li>
                    <li>Pre-shrunk fabric</li>
                    <li>Screen printed design</li>
                    <li>Machine washable (cold, inside out)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                  <Download className="mr-2 h-4 w-4" />
                  Save Image
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" className="p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="relative aspect-[3/4] bg-black/40 rounded-lg overflow-hidden">
              <Image
                src={modelImages[currentModelIndex] || "/placeholder.svg"}
                alt="Model"
                fill
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevModel}
                    className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Previous Model</span>
                  </Button>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Model is wearing size {selectedSize}</p>
                    <p className="text-white/60 text-xs">Height: 5'9" / 175cm</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextModel}
                    className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
                  >
                    <ArrowRight className="h-5 w-5" />
                    <span className="sr-only">Next Model</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg bg-black/40 p-6">
                <h3 className="text-lg font-medium text-white mb-4">Product Information</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-2">Color</h4>
                    <div className="flex gap-3">
                      {productColors.map((color, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "h-8 w-8 rounded-full border-2",
                            selectedColor === color ? "border-purple-400" : "border-transparent",
                          )}
                          style={{ backgroundColor: getColorHex(color) }}
                          aria-label={`Select ${color} color`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-2">Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {productSizes.map((size, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "min-w-[3rem] rounded-md border px-3 py-2 text-sm",
                            selectedSize === size
                              ? "border-purple-400 bg-purple-400/10 text-white"
                              : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-6">
                <h3 className="text-lg font-medium text-white mb-4">Size Guide</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-white/80">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-left font-medium">Size</th>
                        <th className="px-4 py-2 text-left font-medium">Chest (in)</th>
                        <th className="px-4 py-2 text-left font-medium">Length (in)</th>
                        <th className="px-4 py-2 text-left font-medium">Sleeve (in)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="px-4 py-2">S</td>
                        <td className="px-4 py-2">36-38</td>
                        <td className="px-4 py-2">28</td>
                        <td className="px-4 py-2">8</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="px-4 py-2">M</td>
                        <td className="px-4 py-2">39-41</td>
                        <td className="px-4 py-2">29</td>
                        <td className="px-4 py-2">8.5</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="px-4 py-2">L</td>
                        <td className="px-4 py-2">42-44</td>
                        <td className="px-4 py-2">30</td>
                        <td className="px-4 py-2">9</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="px-4 py-2">XL</td>
                        <td className="px-4 py-2">45-47</td>
                        <td className="px-4 py-2">31</td>
                        <td className="px-4 py-2">9.5</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">XXL</td>
                        <td className="px-4 py-2">48-50</td>
                        <td className="px-4 py-2">32</td>
                        <td className="px-4 py-2">10</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                <Image src={productImage || "/placeholder.svg"} alt={productName} fill className="object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-black/40">
                    <Image
                      src="/placeholder.svg?height=150&width=150"
                      alt={`${productName} detail ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{productName}</h2>
                <p className="text-xl font-bold text-white mt-1">$35.00</p>
              </div>

              <div className="space-y-4">
                <p className="text-white/80">
                  This premium quality t-shirt features the Cosmic Healing Frequencies album artwork, printed with
                  eco-friendly inks on 100% organic cotton. The design incorporates sacred geometry elements and chakra
                  symbols that resonate with the album's healing frequencies.
                </p>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Features</h3>
                  <ul className="list-disc pl-5 text-white/80 space-y-1">
                    <li>100% organic cotton</li>
                    <li>Screen printed with eco-friendly inks</li>
                    <li>Relaxed unisex fit</li>
                    <li>Pre-shrunk</li>
                    <li>Machine washable (cold, inside out)</li>
                    <li>Designed and printed in the USA</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Care Instructions</h3>
                  <ul className="list-disc pl-5 text-white/80 space-y-1">
                    <li>Machine wash cold with like colors</li>
                    <li>Wash inside out to protect the print</li>
                    <li>Do not bleach</li>
                    <li>Tumble dry low</li>
                    <li>Iron inside out on low heat if needed</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Color</h3>
                  <div className="flex gap-3">
                    {productColors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2",
                          selectedColor === color ? "border-purple-400" : "border-transparent",
                        )}
                        style={{ backgroundColor: getColorHex(color) }}
                        aria-label={`Select ${color} color`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {productSizes.map((size, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "min-w-[3rem] rounded-md border px-3 py-2 text-sm",
                          selectedSize === size
                            ? "border-purple-400 bg-purple-400/10 text-white"
                            : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setActiveTab("try-on")}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Try It On
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

