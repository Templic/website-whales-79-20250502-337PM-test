import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VirtualTryOn } from "@/components/virtual-try-on"
import { ShoppingCart, Heart, Share2, ArrowLeft } from "lucide-react"

// This would typically come from a CMS or API
const getProductData = (slug: string) => {
  // Example data - in a real app, fetch this from an API
  return {
    id: 1,
    name: "Cosmic Healing Frequencies T-Shirt",
    price: 35.0,
    images: [
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
    ],
    slug: "cosmic-healing-tshirt",
    description:
      "Organic cotton t-shirt featuring the Cosmic Healing Frequencies album artwork. This premium quality shirt is made from 100% organic cotton with a super soft feel and relaxed fit. The design features sacred geometry elements and chakra symbols printed with eco-friendly inks.",
    details: [
      "100% organic cotton",
      "Screen printed with eco-friendly inks",
      "Relaxed unisex fit",
      "Pre-shrunk",
      "Machine washable (cold, inside out)",
      "Designed and printed in the USA",
    ],
    colors: ["Black", "Purple", "White"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    relatedProducts: [
      {
        id: 2,
        name: "Chakra Alignment Hoodie",
        price: 65.0,
        image: "/placeholder.svg?height=300&width=300",
        slug: "chakra-alignment-hoodie",
      },
      {
        id: 3,
        name: "Astral Projection Long Sleeve",
        price: 45.0,
        image: "/placeholder.svg?height=300&width=300",
        slug: "astral-projection-longsleeve",
      },
      {
        id: 4,
        name: "Sacred Geometry Tote Bag",
        price: 25.0,
        image: "/placeholder.svg?height=300&width=300",
        slug: "sacred-geometry-tote",
      },
    ],
    story:
      "This t-shirt design was inspired by the sacred geometry patterns found in ancient meditation temples throughout Nepal. During the recording of the Cosmic Healing Frequencies album, these patterns were observed to resonate with the specific frequencies used in the music. The spiral elements represent the energy flow through the chakras, while the central mandala symbolizes the unity of all energy centers when in perfect alignment.",
  }
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductData(params.slug)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950">
      {/* Product Header */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-2 text-white/60 mb-8">
            <Link href="/merchandise" className="flex items-center gap-1 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Merchandise</span>
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-purple-500/30 bg-black/20 backdrop-blur-sm">
                <Image
                  src={product.images[0] || "/placeholder.svg"}
                  width={600}
                  height={600}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1).map((image, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-lg border border-purple-500/30 bg-black/20 backdrop-blur-sm"
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      width={150}
                      height={150}
                      alt={`${product.name} view ${i + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white">{product.name}</h1>
                <p className="mt-2 text-2xl font-bold text-white">${product.price.toFixed(2)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Color</h3>
                  <div className="flex gap-3">
                    {product.colors.map((color, i) => (
                      <button
                        key={i}
                        className={`h-8 w-8 rounded-full border-2 ${i === 0 ? "border-purple-400" : "border-transparent"}`}
                        style={{
                          backgroundColor:
                            color === "Black"
                              ? "#000"
                              : color === "White"
                                ? "#fff"
                                : color === "Purple"
                                  ? "#9333ea"
                                  : color === "Navy"
                                    ? "#1e3a8a"
                                    : color === "Indigo"
                                      ? "#4f46e5"
                                      : "#9333ea",
                        }}
                        aria-label={`Select ${color} color`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, i) => (
                      <button
                        key={i}
                        className={`min-w-[3rem] rounded-md border px-3 py-2 text-sm ${
                          i === 2
                            ? "border-purple-400 bg-purple-400/10 text-white"
                            : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                    <Heart className="mr-2 h-4 w-4" />
                    Add to Wishlist
                  </Button>
                  <Button variant="ghost" className="text-white hover:bg-white/5">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-black/20 p-1">
                    <TabsTrigger value="description" className="data-[state=active]:bg-purple-900/50">
                      Description
                    </TabsTrigger>
                    <TabsTrigger value="details" className="data-[state=active]:bg-purple-900/50">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="shipping" className="data-[state=active]:bg-purple-900/50">
                      Shipping
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-4 text-white/80 space-y-4">
                    <p>{product.description}</p>
                  </TabsContent>

                  <TabsContent value="details" className="mt-4">
                    <ul className="list-disc pl-5 text-white/80 space-y-2">
                      {product.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="shipping" className="mt-4 text-white/80 space-y-4">
                    <p>Orders are typically processed within 1-2 business days. Shipping times vary by location:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>US: 3-5 business days</li>
                      <li>Canada: 5-7 business days</li>
                      <li>International: 7-14 business days</li>
                    </ul>
                    <p>
                      Free shipping on orders over $75 within the US. International shipping rates calculated at
                      checkout.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Virtual Try-On Section */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Virtual Try-On</h2>
          <VirtualTryOn
            productName={product.name}
            productImage={product.images[0]}
            productColors={product.colors}
            productSizes={product.sizes}
          />
        </div>
      </section>

      {/* Product Story */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-purple-500/30 bg-black/20 backdrop-blur-sm">
              <Image
                src="/placeholder.svg?height=600&width=600"
                width={600}
                height={600}
                alt="Design Inspiration"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">The Story Behind the Design</h2>
              <p className="text-white/80 leading-relaxed">{product.story}</p>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="border-purple-400/50 text-white hover:bg-purple-500/20 hover:text-white"
                >
                  Learn More About Our Process
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">You May Also Like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {product.relatedProducts.map((relatedProduct) => (
              <Link href={`/merchandise/${relatedProduct.slug}`} key={relatedProduct.id} className="group">
                <div className="overflow-hidden rounded-xl bg-black/20 p-4 backdrop-blur-sm transition-all hover:bg-purple-900/20">
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
                    <Image
                      src={relatedProduct.image || "/placeholder.svg"}
                      width={300}
                      height={300}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-sm text-white/60">${relatedProduct.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold text-white mb-8">Recently Viewed</h2>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Link href={`/merchandise/product-${i}`} key={i} className="group">
                <div className="overflow-hidden rounded-xl bg-black/20 p-4 backdrop-blur-sm transition-all hover:bg-purple-900/20">
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
                    <Image
                      src={`/placeholder.svg?height=200&width=200`}
                      width={200}
                      height={200}
                      alt={`Product ${i}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors text-sm">
                    {i === 1 && "Cosmic Healing Vinyl"}
                    {i === 2 && "Meditation Guide Bundle"}
                    {i === 3 && "Healing Crystal Set"}
                    {i === 4 && "Frequency Tuning Fork"}
                  </h3>
                  <p className="text-xs text-white/60">
                    ${i === 1 ? "30.00" : i === 2 ? "25.00" : i === 3 ? "45.00" : "35.00"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <div className="rounded-xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-8 backdrop-blur-sm">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Support Our Cause</h2>
                <p className="text-white/80">
                  With every purchase, you can choose to round up your total to the nearest dollar. The difference will
                  be donated to the Global Sound Healing Foundation, which brings music therapy to underserved
                  communities worldwide.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <Image
                    src="/placeholder.svg?height=60&width=60"
                    width={60}
                    height={60}
                    alt="Global Sound Healing Foundation"
                    className="h-12 w-12"
                  />
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                  Learn More About Our Charity
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

