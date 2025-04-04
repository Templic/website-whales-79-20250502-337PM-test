"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Music, FileText, Download, BarChart } from "lucide-react"
import { format } from "date-fns"

interface Session {
  id: string
  date: string
  duration: number
  frequency: number
  notes: string
}

interface SessionHistoryProps {
  sessions: Session[]
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Format date consistently to avoid hydration mismatches
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Format time consistently to avoid hydration mismatches
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "h:mm a")
    } catch (error) {
      return ""
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="bg-black/30 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Session History</CardTitle>
          <CardDescription className="text-white/60">Track your frequency healing journey</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Clock className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-white font-medium text-lg mb-2">No Sessions Yet</h3>
          <p className="text-white/60 mb-4">
            Your frequency healing sessions will appear here once you start your journey
          </p>
          <Button
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            onClick={() => (window.location.href = "/immersive")}
          >
            <Music className="mr-2 h-4 w-4" />
            Start a Session
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/30 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Session History</CardTitle>
          <CardDescription className="text-white/60">Track your frequency healing journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-white font-medium">{formatDate(session.date)}</span>
                      <span className="text-white/60 text-sm">{formatTime(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-white/60" />
                        <span className="text-white/60 text-sm">{formatDuration(session.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3 text-white/60" />
                        <span className="text-white/60 text-sm">{session.frequency} Hz</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSession && (
        <Card className="bg-black/30 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Session Details</CardTitle>
            <CardDescription className="text-white/60">
              {formatDate(selectedSession.date)} at {formatTime(selectedSession.date)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-white/60 text-sm">Duration</span>
                </div>
                <p className="text-white font-medium">{formatDuration(selectedSession.duration)}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Music className="h-4 w-4 text-purple-400" />
                  <span className="text-white/60 text-sm">Frequency</span>
                </div>
                <p className="text-white font-medium">{selectedSession.frequency} Hz</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span className="text-white/60 text-sm">Notes</span>
                </div>
                <p className="text-white">{selectedSession.notes || "No notes"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <BarChart className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

