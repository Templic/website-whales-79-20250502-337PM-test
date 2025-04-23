"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Home, Lightbulb, Thermometer, Volume2, RefreshCw, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartHomeDevice {
  id: string
  name: string
  type: "light" | "speaker" | "thermostat"
  connected: boolean
  state: {
    power: boolean
    brightness?: number
    color?: string
    volume?: number
    temperature?: number
  }
}

interface SmartHomeIntegrationProps {
  onDeviceUpdate?: (device: SmartHomeDevice) => void
}

export function SmartHomeIntegration({ onDeviceUpdate }: SmartHomeIntegrationProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<SmartHomeDevice[]>([])

  // Simulate scanning for smart home devices
  const scanForDevices = async () => {
    setIsScanning(true)
    setError(null)
    setScanComplete(false)

    try {
      // In a real app, this would use smart home APIs to discover devices
      // For demo purposes, we'll simulate finding devices
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulate found devices
      const mockDevices: SmartHomeDevice[] = [
        {
          id: "light_living_room",
          name: "Living Room Lights",
          type: "light",
          connected: true,
          state: {
            power: false,
            brightness: 80,
            color: "#9333ea",
          },
        },
        {
          id: "speaker_bedroom",
          name: "Bedroom Speaker",
          type: "speaker",
          connected: true,
          state: {
            power: false,
            volume: 50,
          },
        },
        {
          id: "thermostat_main",
          name: "Main Thermostat",
          type: "thermostat",
          connected: true,
          state: {
            power: true,
            temperature: 72,
          },
        },
      ]

      setDevices(mockDevices)
      setScanComplete(true)
    } catch (err) {
      setError("Failed to discover smart home devices. Please check your network connection and try again.")
    } finally {
      setIsScanning(false)
    }
  }

  // Toggle device power
  const toggleDevicePower = (deviceId: string) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        if (device.id === deviceId) {
          const updatedDevice = {
            ...device,
            state: {
              ...device.state,
              power: !device.state.power,
            },
          }

          if (onDeviceUpdate) {
            onDeviceUpdate(updatedDevice)
          }

          return updatedDevice
        }
        return device
      }),
    )
  }

  // Update device brightness
  const updateBrightness = (deviceId: string, brightness: number) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        if (device.id === deviceId) {
          const updatedDevice = {
            ...device,
            state: {
              ...device.state,
              brightness,
            },
          }

          if (onDeviceUpdate) {
            onDeviceUpdate(updatedDevice)
          }

          return updatedDevice
        }
        return device
      }),
    )
  }

  // Update device volume
  const updateVolume = (deviceId: string, volume: number) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        if (device.id === deviceId) {
          const updatedDevice = {
            ...device,
            state: {
              ...device.state,
              volume,
            },
          }

          if (onDeviceUpdate) {
            onDeviceUpdate(updatedDevice)
          }

          return updatedDevice
        }
        return device
      }),
    )
  }

  // Update device temperature
  const updateTemperature = (deviceId: string, temperature: number) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) => {
        if (device.id === deviceId) {
          const updatedDevice = {
            ...device,
            state: {
              ...device.state,
              temperature,
            },
          }

          if (onDeviceUpdate) {
            onDeviceUpdate(updatedDevice)
          }

          return updatedDevice
        }
        return device
      }),
    )
  }

  // Get device icon
  const getDeviceIcon = (type: SmartHomeDevice["type"]) => {
    switch (type) {
      case "light":
        return <Lightbulb className="h-5 w-5" />
      case "speaker":
        return <Volume2 className="h-5 w-5" />
      case "thermostat":
        return <Thermometer className="h-5 w-5" />
      default:
        return <Home className="h-5 w-5" />
    }
  }

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Home className="h-5 w-5 text-purple-400" />
          Smart Home Integration
        </CardTitle>
        <CardDescription className="text-white/60">
          Control your smart home devices for the optimal healing environment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {devices.length === 0 ? (
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm">{error}</p>
              </div>
            )}

            {scanComplete && devices.length === 0 && (
              <div className="rounded-lg bg-amber-900/20 border border-amber-500/30 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm">
                  No smart home devices found. Make sure your devices are powered on and connected to your network.
                </p>
              </div>
            )}

            <Button
              onClick={scanForDevices}
              disabled={isScanning}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scanning for Devices...
                </>
              ) : (
                <>
                  <Home className="mr-2 h-4 w-4" />
                  Discover Smart Home Devices
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-white/60 text-sm">
                Compatible with Philips Hue, Sonos, Nest, and other smart home ecosystems
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-white font-medium">{devices.length} Devices Connected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={scanForDevices}
                disabled={isScanning}
                className="border-white/10 text-white hover:bg-white/5"
              >
                {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="sr-only">Refresh</span>
              </Button>
            </div>

            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="rounded-lg bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          device.state.power ? "bg-purple-500/20" : "bg-white/10",
                        )}
                      >
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{device.name}</h3>
                        <p className="text-white/60 text-xs">
                          {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                        </p>
                      </div>
                    </div>
                    <Switch checked={device.state.power} onCheckedChange={() => toggleDevicePower(device.id)} />
                  </div>

                  {device.state.power && (
                    <div className="space-y-4">
                      {device.type === "light" && device.state.brightness !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-white/60 text-sm">Brightness</Label>
                            <span className="text-white/60 text-sm">{device.state.brightness}%</span>
                          </div>
                          <Slider
                            value={[device.state.brightness]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => updateBrightness(device.id, value[0])}
                          />
                        </div>
                      )}

                      {device.type === "speaker" && device.state.volume !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-white/60 text-sm">Volume</Label>
                            <span className="text-white/60 text-sm">{device.state.volume}%</span>
                          </div>
                          <Slider
                            value={[device.state.volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => updateVolume(device.id, value[0])}
                          />
                        </div>
                      )}

                      {device.type === "thermostat" && device.state.temperature !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-white/60 text-sm">Temperature</Label>
                            <span className="text-white/60 text-sm">{device.state.temperature}°F</span>
                          </div>
                          <Slider
                            value={[device.state.temperature]}
                            min={60}
                            max={85}
                            step={1}
                            onValueChange={(value) => updateTemperature(device.id, value[0])}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
              <Check className="mr-2 h-4 w-4" />
              Optimize Environment for Healing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

