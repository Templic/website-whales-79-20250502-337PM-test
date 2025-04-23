/**
 * performance-optimizations.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
import React from "react";

/**
 * performance-optimizations.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Shield, Database, Clock, BarChart, Gauge, Cog, Download, Wifi, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PerformanceMetric {
  name: string
  value: number
  target: number
  unit: string
  icon: React.ReactNode
  status: "good" | "warning" | "poor"
}

interface SecuritySetting {
  name: string
  description: string
  enabled: boolean
  recommended: boolean
}

export function PerformanceOptimizations() {
  const [activeTab, setActiveTab] = useState("performance")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      name: "Content Security Policy",
      description: "Prevent XSS attacks by controlling which resources can be loaded",
      enabled: true,
      recommended: true,
    },
    {
      name: "HTTPS Enforcement",
      description: "Redirect all HTTP traffic to HTTPS for secure connections",
      enabled: true,
      recommended: true,
    },
    {
      name: "Audio Download Protection",
      description: "Prevent unauthorized downloading of audio content",
      enabled: false,
      recommended: true,
    },
    {
      name: "Advanced Bot Protection",
      description: "Block malicious bots and scrapers from accessing the site",
      enabled: true,
      recommended: true,
    },
    {
      name: "Two-Factor Authentication",
      description: "Require 2FA for administrative access",
      enabled: true,
      recommended: true,
    },
  ])

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      name: "Page Load Time",
      value: 2.4,
      target: 2.0,
      unit: "seconds",
      icon: <Clock className="h-5 w-5 text-purple-400" />,
      status: "warning",
    },
    {
      name: "First Contentful Paint",
      value: 1.2,
      target: 1.5,
      unit: "seconds",
      icon: <Gauge className="h-5 w-5 text-purple-400" />,
      status: "good",
    },
    {
      name: "Time to Interactive",
      value: 3.1,
      target: 3.0,
      unit: "seconds",
      icon: <Cog className="h-5 w-5 text-purple-400" />,
      status: "warning",
    },
    {
      name: "Largest Contentful Paint",
      value: 2.8,
      target: 2.5,
      unit: "seconds",
      icon: <BarChart className="h-5 w-5 text-purple-400" />,
      status: "warning",
    },
    {
      name: "Cumulative Layout Shift",
      value: 0.02,
      target: 0.1,
      unit: "",
      icon: <Wifi className="h-5 w-5 text-purple-400" />,
      status: "good",
    },
  ]

  // Mock optimization function
  const runOptimizations = () => {
    setIsOptimizing(true)
    setOptimizationProgress(0)

    const interval = setInterval(() => {
      setOptimizationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsOptimizing(false)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  // Toggle security setting
  const toggleSecurity = (index: number) => {
    const newSettings = [...securitySettings]
    newSettings[index].enabled = !newSettings[index].enabled
    setSecuritySettings(newSettings)
  }

  const getStatusColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "poor":
        return "text-red-500"
      default:
        return "text-white/70"
    }
  }

  const getProgressColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-purple-500"
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Performance & Security</h2>
        </div>
      </div>

      <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="performance"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="caching"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Caching
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="performance" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Performance Metrics</h3>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {performanceMetrics.map((metric, i) => (
                <div key={i} className="rounded-lg bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <h4 className="font-medium text-white">{metric.name}</h4>
                    </div>
                    <div className={cn("text-sm font-bold", getStatusColor(metric.status))}>
                      {metric.value}
                      {metric.unit}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getProgressColor(metric.status))}
                        style={{ width: `${(metric.value / metric.target) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>
                        Target: {metric.target}
                        {metric.unit}
                      </span>
                      <span className={getStatusColor(metric.status)}>
                        {metric.status === "good" ? "Good" : metric.status === "warning" ? "Needs Improvement" : "Poor"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-black/40 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Optimization Recommendations</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Optimize Images</h4>
                  <p className="text-sm text-white/70">
                    Several images on the site could be further compressed or converted to next-gen formats like WebP to
                    improve loading times.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Implement Lazy Loading</h4>
                  <p className="text-sm text-white/70">
                    Defer loading of off-screen images and non-critical resources to improve initial page load time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="h-3 w-3 text-red-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Reduce JavaScript Bundle Size</h4>
                  <p className="text-sm text-white/70">
                    The main JavaScript bundle is larger than necessary. Consider code splitting and removing unused
                    dependencies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Server-Side Rendering</h4>
                  <p className="text-sm text-white/70">
                    The site is already using server-side rendering effectively for improved initial load times.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              {isOptimizing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Optimizing site performance...</span>
                    <span className="text-white font-medium">{optimizationProgress}%</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
                </div>
              ) : (
                <Button
                  onClick={runOptimizations}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Run Automatic Optimizations
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Security Settings</h3>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-green-500 font-medium">Security Score: 85/100</span>
              </div>
            </div>

            <div className="space-y-4">
              {securitySettings.map((setting, i) => (
                <div key={i} className="rounded-lg bg-black/40 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{setting.name}</h4>
                      {setting.recommended && (
                        <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70">{setting.description}</p>
                  </div>
                  <Switch checked={setting.enabled} onCheckedChange={() => toggleSecurity(i)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-black/40 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Security Scan Results</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">No Vulnerabilities Detected</h4>
                  <p className="text-sm text-white/70">
                    The last security scan completed on March 25, 2024 found no critical vulnerabilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Shield className="h-3 w-3 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Outdated Dependencies</h4>
                  <p className="text-sm text-white/70">
                    3 npm packages are outdated and should be updated to their latest versions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">HTTPS Properly Configured</h4>
                  <p className="text-sm text-white/70">
                    SSL/TLS is properly configured with modern protocols and strong ciphers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                <Shield className="mr-2 h-4 w-4" />
                Run Security Scan
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="caching" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Caching Configuration</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">Audio File Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">
                  Cache audio files on the client side to reduce bandwidth usage and improve playback performance.
                </p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>7 days</span>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">Image Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">Cache images to improve page load times and reduce server load.</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">API Response Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">
                  Cache API responses to reduce database load and improve response times.
                </p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>1 hour</span>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">CDN Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">
                  Use Content Delivery Network caching to serve content from edge locations closer to users.
                </p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>14 days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-black/40 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Offline Access</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Enable Progressive Web App</h4>
                  <p className="text-sm text-white/70">
                    Allow users to install the site as an app and access content offline.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Offline Audio Playback</h4>
                  <p className="text-sm text-white/70">Allow users to download and play audio tracks when offline.</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Background Sync</h4>
                  <p className="text-sm text-white/70">
                    Sync user actions (like favorites or playlists) when connection is restored.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                <Download className="mr-2 h-4 w-4" />
                Generate Service Worker
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}



/**
 * Original PerformanceOptimizations component merged from: client/src/components/common/system/performance-optimizations.tsx
 * Merge date: 2025-04-05
 */
function PerformanceOptimizationsOriginal() {
  const [activeTab, setActiveTab] = useState("performance")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      name: "Content Security Policy",
      description: "Prevent XSS attacks by controlling which resources can be loaded",
      enabled: true,
      recommended: true,
    },
    {
      name: "HTTPS Enforcement",
      description: "Redirect all HTTP traffic to HTTPS for secure connections",
      enabled: true,
      recommended: true,
    },
    {
      name: "Audio Download Protection",
      description: "Prevent unauthorized downloading of audio content",
      enabled: false,
      recommended: true,
    },
    {
      name: "Advanced Bot Protection",
      description: "Block malicious bots and scrapers from accessing the site",
      enabled: true,
      recommended: true,
    },
    {
      name: "Two-Factor Authentication",
      description: "Require 2FA for administrative access",
      enabled: true,
      recommended: true,
    },
  ])

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    {
      name: "Page Load Time",
      value: 2.4,
      target: 2.0,
      unit: "seconds",
      icon: <Clock className="h-5 w-5 text-purple-400" />,
      status: "warning",
    },
    {
      name: "First Contentful Paint",
      value: 1.2,
      target: 1.5,
      unit: "seconds",
      icon: <Gauge className="h-5 w-5 text-purple-400" />,
      status: "good",
    },
    {
      name: "Time to Interactive",
      value: 3.1,
      target: 3.0,
      unit: "seconds",
      icon: <Cog className="h-5 w-5 text-purple-400" />,
      status: "warning",
    },
    {
      name: "Largest Contentful Paint",
      value: 2.8,
      target: 2.5,
      unit: "seconds",
      icon: <BarChart className="h-5 w-5 text-purple-400" />,
      status: "warning",
    },
    {
      name: "Cumulative Layout Shift",
      value: 0.02,
      target: 0.1,
      unit: "",
      icon: <Wifi className="h-5 w-5 text-purple-400" />,
      status: "good",
    },
  ]

  // Mock optimization function
  const runOptimizations = () => {
    setIsOptimizing(true)
    setOptimizationProgress(0)

    const interval = setInterval(() => {
      setOptimizationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsOptimizing(false)
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  // Toggle security setting
  const toggleSecurity = (index: number) => {
    const newSettings = [...securitySettings]
    newSettings[index].enabled = !newSettings[index].enabled
    setSecuritySettings(newSettings)
  }

  const getStatusColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "poor":
        return "text-red-500"
      default:
        return "text-white/70"
    }
  }

  const getProgressColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-purple-500"
    }
  }

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Performance & Security</h2>
        </div>
      </div>

      <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-white/10">
          <TabsList className="flex h-auto p-0 bg-transparent">
            <TabsTrigger
              value="performance"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="caching"
              className="flex-1 rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Caching
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="performance" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Performance Metrics</h3>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {performanceMetrics.map((metric, i) => (
                <div key={i} className="rounded-lg bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {metric.icon}
                      <h4 className="font-medium text-white">{metric.name}</h4>
                    </div>
                    <div className={cn("text-sm font-bold", getStatusColor(metric.status))}>
                      {metric.value}
                      {metric.unit}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getProgressColor(metric.status))}
                        style={{ width: `${(metric.value / metric.target) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>
                        Target: {metric.target}
                        {metric.unit}
                      </span>
                      <span className={getStatusColor(metric.status)}>
                        {metric.status === "good" ? "Good" : metric.status === "warning" ? "Needs Improvement" : "Poor"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-black/40 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Optimization Recommendations</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Optimize Images</h4>
                  <p className="text-sm text-white/70">
                    Several images on the site could be further compressed or converted to next-gen formats like WebP to
                    improve loading times.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Implement Lazy Loading</h4>
                  <p className="text-sm text-white/70">
                    Defer loading of off-screen images and non-critical resources to improve initial page load time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="h-3 w-3 text-red-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Reduce JavaScript Bundle Size</h4>
                  <p className="text-sm text-white/70">
                    The main JavaScript bundle is larger than necessary. Consider code splitting and removing unused
                    dependencies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Server-Side Rendering</h4>
                  <p className="text-sm text-white/70">
                    The site is already using server-side rendering effectively for improved initial load times.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              {isOptimizing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Optimizing site performance...</span>
                    <span className="text-white font-medium">{optimizationProgress}%</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
                </div>
              ) : (
                <Button
                  onClick={runOptimizations}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Run Automatic Optimizations
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Security Settings</h3>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-green-500 font-medium">Security Score: 85/100</span>
              </div>
            </div>

            <div className="space-y-4">
              {securitySettings.map((setting, i) => (
                <div key={i} className="rounded-lg bg-black/40 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{setting.name}</h4>
                      {setting.recommended && (
                        <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70">{setting.description}</p>
                  </div>
                  <Switch checked={setting.enabled} onCheckedChange={() => toggleSecurity(i)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-black/40 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Security Scan Results</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">No Vulnerabilities Detected</h4>
                  <p className="text-sm text-white/70">
                    The last security scan completed on March 25, 2024 found no critical vulnerabilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Shield className="h-3 w-3 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Outdated Dependencies</h4>
                  <p className="text-sm text-white/70">
                    3 npm packages are outdated and should be updated to their latest versions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-white">HTTPS Properly Configured</h4>
                  <p className="text-sm text-white/70">
                    SSL/TLS is properly configured with modern protocols and strong ciphers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                <Shield className="mr-2 h-4 w-4" />
                Run Security Scan
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="caching" className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Caching Configuration</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">Audio File Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">
                  Cache audio files on the client side to reduce bandwidth usage and improve playback performance.
                </p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>7 days</span>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">Image Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">Cache images to improve page load times and reduce server load.</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">API Response Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">
                  Cache API responses to reduce database load and improve response times.
                </p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>1 hour</span>
                </div>
              </div>

              <div className="rounded-lg bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">CDN Caching</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-white/70">
                  Use Content Delivery Network caching to serve content from edge locations closer to users.
                </p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Cache Duration</span>
                  <span>14 days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-black/40 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Offline Access</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Enable Progressive Web App</h4>
                  <p className="text-sm text-white/70">
                    Allow users to install the site as an app and access content offline.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Offline Audio Playback</h4>
                  <p className="text-sm text-white/70">Allow users to download and play audio tracks when offline.</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">Background Sync</h4>
                  <p className="text-sm text-white/70">
                    Sync user actions (like favorites or playlists) when connection is restored.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                <Download className="mr-2 h-4 w-4" />
                Generate Service Worker
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

