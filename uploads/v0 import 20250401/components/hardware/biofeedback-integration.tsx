"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Activity, Heart, Brain, Zap, Bluetooth, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BiofeedbackData {
  heartRate: number | null
  brainwaveAlpha: number | null
  brainwaveBeta: number | null
  brainwaveTheta: number | null
  brainwaveDelta: number | null
  galvanicSkinResponse: number | null
  connected: boolean
  lastUpdated: number | null
}

interface BiofeedbackIntegrationProps {
  onDataUpdate?: (data: BiofeedbackData) => void
  adaptFrequency?: boolean
}

export function BiofeedbackIntegration({ onDataUpdate, adaptFrequency = false }: BiofeedbackIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [data, setData] = useState<BiofeedbackData>({
    heartRate: null,
    brainwaveAlpha: null,
    brainwaveBeta: null,
    brainwaveTheta: null,
    brainwaveDelta: null,
    galvanicSkinResponse: null,
    connected: false,
    lastUpdated: null,
  })
  const [autoAdapt, setAutoAdapt] = useState(adaptFrequency)
  const [deviceType, setDeviceType] = useState<"headband" | "wristband" | "both">("both")
  const [error, setError] = useState<string | null>(null)

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate connection to biofeedback device
  const connectDevice = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // In a real app, this would use Web Bluetooth API to connect to a device
      // For demo purposes, we'll simulate a connection
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful connection
      setData((prev) => ({
        ...prev,
        connected: true,
        lastUpdated: Date.now(),
      }))

      // Start simulating data
      startDataSimulation()
    } catch (err) {
      setError("Failed to connect to device. Please ensure Bluetooth is enabled and try again.")
    } finally {
      setIsConnecting(false)
      setIsScanning(false)
    }
  }

  // Disconnect from device
  const disconnectDevice = () => {
    // Stop data simulation
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }

    setData({
      heartRate: null,
      brainwaveAlpha: null,
      brainwaveBeta: null,
      brainwaveTheta: null,
      brainwaveDelta: null,
      galvanicSkinResponse: null,
      connected: false,
      lastUpdated: null,
    })
  }

  // Simulate scanning for devices
  const scanForDevices = () => {
    setIsScanning(true)

    // In a real app, this would use Web Bluetooth API to scan for devices
    // For demo purposes, we'll simulate scanning and then connect
    setTimeout(() => {
      connectDevice()
    }, 2000)
  }

  // Simulate biofeedback data
  const startDataSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }

    simulationIntervalRef.current = setInterval(() => {
      const newData: BiofeedbackData = {
        heartRate: Math.floor(60 + Math.random() * 40), // 60-100 bpm
        brainwaveAlpha: 8 + Math.random() * 4, // 8-12 Hz
        brainwaveBeta: 12 + Math.random() * 18, // 12-30 Hz
        brainwaveTheta: 4 + Math.random() * 4, // 4-8 Hz
        brainwaveDelta: 1 + Math.random() * 3, // 1-4 Hz
        galvanicSkinResponse: Math.random() * 20, // 0-20 microsiemens
        connected: true,
        lastUpdated: Date.now(),
      }

      setData(newData)

      if (onDataUpdate) {
        onDataUpdate(newData)
      }
    }, 1000)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [])

  // Calculate dominant brainwave
  const getDominantBrainwave = () => {
    if (!data.brainwaveAlpha || !data.brainwaveBeta || !data.brainwaveTheta || !data.brainwaveDelta) {
      return null
    }

    const waves = [
      { name: "Alpha", value: data.brainwaveAlpha },
      { name: "Beta", value: data.brainwaveBeta },
      { name: "Theta", value: data.brainwaveTheta },
      { name: "Delta", value: data.brainwaveDelta },
    ]

    return waves.reduce((max, wave) => (wave.value > max.value ? wave : max))
  }

  const dominantWave = getDominantBrainwave()

  // Get recommended frequency based on biofeedback
  const getRecommendedFrequency = () => {
    if (!dominantWave) return null

    // Map dominant brainwave to solfeggio frequencies
    switch (dominantWave.name) {
      case "Delta":
        return 396 // Liberating guilt and fear
      case "Theta":
        return 528 // Transformation and miracles
      case "Alpha":
        return 639 // Connecting/relationships
      case "Beta":
        return 741 // Awakening intuition
      default:
        return 432 // Universal frequency
    }
  }

  const recommendedFrequency = getRecommendedFrequency()

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          Biofeedback Integration
        </CardTitle>
        <CardDescription className="text-white/60">
          Connect biofeedback devices to optimize your frequency experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!data.connected ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-black/40 p-4">
              <h3 className="text-white font-medium mb-2">Select Device Type</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "border-white/10 text-white hover:bg-white/5",
                    deviceType === "headband" && "bg-purple-500/20 border-purple-500",
                  )}
                  onClick={() => setDeviceType("headband")}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Headband
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "border-white/10 text-white hover:bg-white/5",
                    deviceType === "wristband" && "bg-purple-500/20 border-purple-500",
                  )}
                  onClick={() => setDeviceType("wristband")}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Wristband
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "border-white/10 text-white hover:bg-white/5",
                    deviceType === "both" && "bg-purple-500/20 border-purple-500",
                  )}
                  onClick={() => setDeviceType("both")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Both
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={scanForDevices}
              disabled={isScanning || isConnecting}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning for Devices...
                </>
              ) : isConnecting ? (
                <>
                  <Bluetooth className="mr-2 h-4 w-4 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth className="mr-2 h-4 w-4" />
                  Connect Device
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-white/60 text-sm">
                Make sure your biofeedback device is turned on and in pairing mode
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-white font-medium">Device Connected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectDevice}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Disconnect
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-white/60 text-sm">Heart Rate</span>
                </div>
                <p className="text-white text-2xl font-medium">
                  {data.heartRate} <span className="text-sm text-white/60">BPM</span>
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span className="text-white/60 text-sm">Dominant Brainwave</span>
                </div>
                <p className="text-white text-2xl font-medium">
                  {dominantWave ? (
                    <>
                      {dominantWave.name}{" "}
                      <span className="text-sm text-white/60">{dominantWave.value.toFixed(1)} Hz</span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium">Brainwave Activity</h3>
              <div className="space-y-3">
                {[
                  { name: "Delta", value: data.brainwaveDelta, color: "bg-blue-500", range: "1-4 Hz" },
                  { name: "Theta", value: data.brainwaveTheta, color: "bg-green-500", range: "4-8 Hz" },
                  { name: "Alpha", value: data.brainwaveAlpha, color: "bg-purple-500", range: "8-12 Hz" },
                  { name: "Beta", value: data.brainwaveBeta, color: "bg-red-500", range: "12-30 Hz" },
                ].map((wave) => (
                  <div key={wave.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">
                        {wave.name} ({wave.range})
                      </span>
                      <span className="text-white/60 text-sm">{wave.value?.toFixed(1) || "—"} Hz</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${wave.color}`}
                        style={{ width: wave.value ? `${(wave.value / 30) * 100}%` : "0%" }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {recommendedFrequency && (
              <div className="rounded-lg bg-purple-900/20 border border-purple-500/30 p-4">
                <h3 className="text-white font-medium mb-2">Recommended Frequency</h3>
                <div className="flex items-center justify-between">
                  <p className="text-white">{recommendedFrequency} Hz</p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-adapt" className="text-white/80 text-sm">
                      Auto-adapt
                    </Label>
                    <Switch id="auto-adapt" checked={autoAdapt} onCheckedChange={setAutoAdapt} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

