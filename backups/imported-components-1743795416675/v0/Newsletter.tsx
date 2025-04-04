/**
 * Newsletter.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: v0_extract/components/newsletter.tsx
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setStatus("error")
      setMessage("Please enter your email address")
      return
    }

    setStatus("loading")

    // Simulate API call
    setTimeout(() => {
      setStatus("success")
      setMessage("Thank you for subscribing!")
      setEmail("")
    }, 1500)
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "h-12 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-purple-400",
              status === "error" && "border-red-500",
            )}
            disabled={status === "loading" || status === "success"}
          />
          {status === "loading" && (
            <div className="absolute right-3 top-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className={cn(
            "w-full h-12 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700",
            status === "loading" && "opacity-70 cursor-not-allowed",
            status === "success" && "bg-green-500 hover:bg-green-600",
          )}
          disabled={status === "loading" || status === "success"}
        >
          {status === "idle" && "Subscribe"}
          {status === "loading" && "Subscribing..."}
          {status === "success" && "Subscribed!"}
          {status === "error" && "Try Again"}
        </Button>

        {message && (
          <p className={cn("text-sm text-center", status === "error" ? "text-red-400" : "text-green-400")}>{message}</p>
        )}
      </form>
    </div>
  )
}

