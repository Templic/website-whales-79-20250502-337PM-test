/**
 * donation-module.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, CreditCard, Wallet, Gift, DollarSign, Info, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface DonationModuleProps {
  charityName?: string
  charityLogo?: string
  charityDescription?: string
  defaultAmount?: number
  suggestedAmounts?: number[]
  showRoundUp?: boolean
  productPrice?: number
}

export function DonationModule({
  charityName = "Global Sound Healing Foundation",
  charityLogo = "/placeholder.svg?height=100&width=100",
  charityDescription = "The Global Sound Healing Foundation brings music therapy to underserved communities worldwide, using the power of sound to heal and transform lives.",
  defaultAmount = 5,
  suggestedAmounts = [2, 5, 10, 25, 50],
  showRoundUp = true,
  productPrice = 35.0,
}: DonationModuleProps) {
  const [donationType, setDonationType] = useState<"one-time" | "monthly" | "round-up">(
    showRoundUp ? "round-up" : "one-time",
  )
  const [donationAmount, setDonationAmount] = useState<number | "custom">(defaultAmount)
  const [customAmount, setCustomAmount] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showThanks, setShowThanks] = useState(false)

  const roundUpAmount = productPrice ? Math.ceil(productPrice) - productPrice : 0

  const handleDonationSubmit = () => {
    // In a real app, this would process the donation
    setShowThanks(true)

    // Reset after 5 seconds
    setTimeout(() => {
      setShowThanks(false)
    }, 5000)
  }

  const getActualAmount = () => {
    if (donationType === "round-up") {
      return roundUpAmount
    }

    if (donationAmount === "custom") {
      return Number.parseFloat(customAmount) || 0
    }

    return donationAmount
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      {showThanks ? (
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You for Your Donation!</h2>
          <p className="text-white/80 max-w-md mb-6">
            Your contribution of ${getActualAmount().toFixed(2)} to the {charityName} will help bring the healing power
            of music to those who need it most.
          </p>
          <Button
            variant="outline"
            className="border-purple-400/50 text-white hover:bg-purple-500/20 hover:text-white"
            onClick={() => setShowThanks(false)}
          >
            Continue Shopping
          </Button>
        </div>
      ) : (
        <>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Support Our Cause</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden bg-white/10">
                    <Image src={charityLogo || "/placeholder.svg"} alt={charityName} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{charityName}</h3>
                    <p className="text-sm text-white/60">Healing Through Sound</p>
                  </div>
                </div>

                <p className="text-white/80">{charityDescription}</p>

                <div className="rounded-lg bg-black/40 p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-purple-400" />
                    Your Impact
                  </h4>
                  <div className="space-y-3 text-sm text-white/80">
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <DollarSign className="h-3 w-3 text-purple-400" />
                      </div>
                      <p>$5 provides a healing sound session for one person</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <DollarSign className="h-3 w-3 text-purple-400" />
                      </div>
                      <p>$25 funds a group sound healing workshop for a community</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-purple-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <DollarSign className="h-3 w-3 text-purple-400" />
                      </div>
                      <p>$50 provides basic sound healing instruments to a community center</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Tabs
                  defaultValue={donationType}
                  onValueChange={(value) => setDonationType(value as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-black/20 p-1">
                    <TabsTrigger value="one-time" className="data-[state=active]:bg-purple-900/50">
                      One-Time
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="data-[state=active]:bg-purple-900/50">
                      Monthly
                    </TabsTrigger>
                    {showRoundUp && (
                      <TabsTrigger value="round-up" className="data-[state=active]:bg-purple-900/50">
                        Round-Up
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="one-time" className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-3">Select Amount</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {suggestedAmounts.map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setDonationAmount(amount)}
                            className={cn(
                              "rounded-md border px-3 py-2 text-sm",
                              donationAmount === amount
                                ? "border-purple-400 bg-purple-400/10 text-white"
                                : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                            )}
                          >
                            ${amount}
                          </button>
                        ))}
                        <button
                          onClick={() => setDonationAmount("custom")}
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm",
                            donationAmount === "custom"
                              ? "border-purple-400 bg-purple-400/10 text-white"
                              : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                          )}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {donationAmount === "custom" && (
                      <div>
                        <Label htmlFor="custom-amount" className="text-sm text-white/70">
                          Enter Custom Amount
                        </Label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/70">$</span>
                          <Input
                            id="custom-amount"
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                            placeholder="Enter amount"
                            min="1"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="anonymous"
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                      />
                      <label
                        htmlFor="anonymous"
                        className="text-sm font-medium leading-none text-white/70 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Make my donation anonymous
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-3">Select Monthly Amount</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {suggestedAmounts.slice(0, 5).map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setDonationAmount(amount)}
                            className={cn(
                              "rounded-md border px-3 py-2 text-sm",
                              donationAmount === amount
                                ? "border-purple-400 bg-purple-400/10 text-white"
                                : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                            )}
                          >
                            ${amount}/mo
                          </button>
                        ))}
                        <button
                          onClick={() => setDonationAmount("custom")}
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm",
                            donationAmount === "custom"
                              ? "border-purple-400 bg-purple-400/10 text-white"
                              : "border-white/20 bg-black/20 text-white/70 hover:border-white/40 hover:text-white",
                          )}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {donationAmount === "custom" && (
                      <div>
                        <Label htmlFor="custom-amount-monthly" className="text-sm text-white/70">
                          Enter Custom Monthly Amount
                        </Label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/70">$</span>
                          <Input
                            id="custom-amount-monthly"
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400"
                            placeholder="Enter monthly amount"
                            min="1"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="anonymous-monthly"
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                      />
                      <label
                        htmlFor="anonymous-monthly"
                        className="text-sm font-medium leading-none text-white/70 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Make my donation anonymous
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="round-up" className="mt-4 space-y-4">
                    <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-4">
                      <h4 className="font-medium text-white mb-2">Round Up Your Purchase</h4>
                      <p className="text-white/80 text-sm">
                        Round up your purchase to the nearest dollar and donate the difference to {charityName}.
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/70">
                            Purchase amount: <span className="text-white">${productPrice.toFixed(2)}</span>
                          </p>
                          <p className="text-sm text-white/70">
                            Round up amount: <span className="text-white">${roundUpAmount.toFixed(2)}</span>
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-purple-400" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-medium text-white/70 mb-3">Payment Method</h4>
                  <RadioGroup defaultValue="card" className="space-y-3">
                    <div className="flex items-center space-x-2 rounded-md border border-white/20 bg-black/20 p-3">
                      <RadioGroupItem value="card" id="payment-card" />
                      <Label htmlFor="payment-card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4 text-purple-400" />
                        <span className="text-white">Credit/Debit Card</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border border-white/20 bg-black/20 p-3">
                      <RadioGroupItem value="paypal" id="payment-paypal" />
                      <Label htmlFor="payment-paypal" className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="h-4 w-4 text-purple-400" />
                        <span className="text-white">PayPal</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border border-white/20 bg-black/20 p-3">
                      <RadioGroupItem value="gift" id="payment-gift" />
                      <Label htmlFor="payment-gift" className="flex items-center gap-2 cursor-pointer">
                        <Gift className="h-4 w-4 text-purple-400" />
                        <span className="text-white">Gift Card</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleDonationSubmit}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {donationType === "round-up"
                    ? `Round Up & Donate $${roundUpAmount.toFixed(2)}`
                    : donationType === "monthly"
                      ? `Donate $${getActualAmount()} Monthly`
                      : `Donate $${getActualAmount()}`}
                </Button>

                <p className="text-center text-xs text-white/60">
                  100% of your donation goes directly to {charityName}. We cover all processing fees.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

