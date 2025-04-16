"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  BarChart2,
  LineChartIcon as LineIcon,
  PieChartIcon as PieIcon,
  Download,
  Share2,
  FileText,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

interface EffectivenessData {
  date: string
  frequency: number
  duration: number
  beforeScore: number
  afterScore: number
  symptoms: string[]
  notes: string
}

interface EffectivenessTrackerProps {
  data?: EffectivenessData[]
}

export function EffectivenessTracker({ data = [] }: EffectivenessTrackerProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month")

  // Use session data from user if available, otherwise use provided data
  const sessionData = user?.sessions?.length
    ? user.sessions.map((session) => ({
        date: session.date,
        frequency: session.frequency,
        duration: session.duration,
        beforeScore: Math.floor(Math.random() * 5) + 1, // Mock data
        afterScore: Math.floor(Math.random() * 5) + 5, // Mock data
        symptoms: ["stress", "anxiety", "fatigue"],
        notes: session.notes,
      }))
    : data.length
      ? data
      : generateMockData()

  // Generate mock data for demonstration
  function generateMockData(): EffectivenessData[] {
    const mockData: EffectivenessData[] = []
    const now = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      mockData.push({
        date: date.toISOString(),
        frequency: [396, 417, 528, 639, 741, 852][Math.floor(Math.random() * 6)],
        duration: Math.floor(Math.random() * 20) + 5,
        beforeScore: Math.floor(Math.random() * 5) + 1,
        afterScore: Math.floor(Math.random() * 5) + 5,
        symptoms: ["stress", "anxiety", "fatigue", "insomnia", "pain"].slice(0, Math.floor(Math.random() * 3) + 1),
        notes: "Session notes would appear here",
      })
    }

    return mockData
  }

  // Calculate effectiveness metrics
  const calculateMetrics = () => {
    if (sessionData.length === 0) return null

    const totalSessions = sessionData.length
    const totalDuration = sessionData.reduce((sum, session) => sum + session.duration, 0)
    const averageImprovement =
      sessionData.reduce((sum, session) => sum + (session.afterScore - session.beforeScore), 0) / totalSessions

    // Calculate most effective frequency
    const frequencyEffectiveness: Record<number, { count: number; improvement: number }> = {}

    sessionData.forEach((session) => {
      const improvement = session.afterScore - session.beforeScore
      if (!frequencyEffectiveness[session.frequency]) {
        frequencyEffectiveness[session.frequency] = { count: 0, improvement: 0 }
      }

      frequencyEffectiveness[session.frequency].count++
      frequencyEffectiveness[session.frequency].improvement += improvement
    })

    let mostEffectiveFrequency = 0
    let highestAvgImprovement = 0

    Object.entries(frequencyEffectiveness).forEach(([freq, data]) => {
      const avgImprovement = data.improvement / data.count
      if (avgImprovement > highestAvgImprovement && data.count >= 3) {
        highestAvgImprovement = avgImprovement
        mostEffectiveFrequency = Number.parseInt(freq)
      }
    })

    return {
      totalSessions,
      totalDuration,
      averageImprovement,
      mostEffectiveFrequency,
      highestAvgImprovement,
    }
  }

  const metrics = calculateMetrics()

  // Format date consistently
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-purple-400" />
          Effectiveness Tracker
        </CardTitle>
        <CardDescription className="text-white/60">Track and analyze your healing progress over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sessionData.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-medium text-lg mb-2">No Data Available</h3>
            <p className="text-white/60 mb-4">Start tracking your sessions to see effectiveness data and insights</p>
            <Button
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              onClick={() => (window.location.href = "/immersive")}
            >
              Start a Session
            </Button>
          </div>
        ) : (
          <>
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-white/60 text-sm mb-1">Total Sessions</p>
                  <p className="text-white text-2xl font-medium">{metrics.totalSessions}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-white/60 text-sm mb-1">Total Minutes</p>
                  <p className="text-white text-2xl font-medium">{metrics.totalDuration}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-white/60 text-sm mb-1">Avg. Improvement</p>
                  <p className="text-white text-2xl font-medium">+{metrics.averageImprovement.toFixed(1)}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-white/60 text-sm mb-1">Best Frequency</p>
                  <p className="text-white text-2xl font-medium">{metrics.mostEffectiveFrequency} Hz</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Data Visualization</h3>
              <div className="flex items-center gap-2">
                {["week", "month", "year"].map((range) => (
                  <Button
                    key={range}
                    variant="outline"
                    size="sm"
                    className={`border-white/10 text-white hover:bg-white/5 ${
                      timeRange === range ? "bg-purple-500/20 border-purple-500" : ""
                    }`}
                    onClick={() => setTimeRange(range as "week" | "month" | "year")}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/20 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-900/50">
                  <BarChart className="mr-2 h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-purple-900/50">
                  <LineIcon className="mr-2 h-4 w-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="frequencies" className="data-[state=active]:bg-purple-900/50">
                  <PieIcon className="mr-2 h-4 w-4" />
                  Frequencies
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="rounded-lg bg-black/40 p-4 h-64 flex items-center justify-center">
                  <p className="text-white/60">
                    [Bar chart visualization would appear here showing before/after scores]
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="mt-4">
                <div className="rounded-lg bg-black/40 p-4 h-64 flex items-center justify-center">
                  <p className="text-white/60">
                    [Line chart visualization would appear here showing improvement over time]
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="frequencies" className="mt-4">
                <div className="rounded-lg bg-black/40 p-4 h-64 flex items-center justify-center">
                  <p className="text-white/60">
                    [Pie chart visualization would appear here showing effectiveness by frequency]
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <Share2 className="mr-2 h-4 w-4" />
                Share Insights
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-white font-medium mb-3">Recent Sessions</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {sessionData.slice(0, 5).map((session, index) => (
                  <div key={index} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{formatDate(session.date)}</span>
                          <span className="text-white/60 text-sm">{session.frequency} Hz</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/60 text-xs">{session.duration} minutes</span>
                          <span className="text-green-400 text-xs">
                            +{session.afterScore - session.beforeScore} improvement
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="text-white/60 text-xs">Before</div>
                        <div className="w-8 h-4 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${(session.beforeScore / 10) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-white/60 text-xs">After</div>
                        <div className="w-8 h-4 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(session.afterScore / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

