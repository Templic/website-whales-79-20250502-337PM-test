"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"
import { UserCircle, Settings, History, LogOut, Save, Music, Bell, Moon } from "lucide-react"
import { SessionHistory } from "@/components/profile/session-history"
import { FrequencyPreferences } from "@/components/profile/frequency-preferences"

export function UserProfile() {
  const { user, logout, updatePreferences } = useAuth()
  const router = useRouter()

  const [darkMode, setDarkMode] = useState(user?.preferences.darkMode || false)
  const [notifications, setNotifications] = useState(user?.preferences.notificationsEnabled || false)
  const [isSaving, setIsSaving] = useState(false)

  if (!user) {
    router.push("/login")
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const savePreferences = async () => {
    setIsSaving(true)

    try {
      updatePreferences({
        darkMode,
        notificationsEnabled: notifications,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <UserCircle className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-white/60">{user.email}</p>
          </div>
        </div>

        <Button variant="outline" onClick={handleLogout} className="border-white/10 text-white hover:bg-white/5">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/20 p-1">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-purple-900/50">
            <History className="mr-2 h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-purple-900/50">
            <Music className="mr-2 h-4 w-4" />
            Frequencies
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-900/50">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <SessionHistory sessions={user.sessions} />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <FrequencyPreferences
            favoriteFrequencies={user.preferences.favoriteFrequencies}
            preferredWaveType={user.preferences.preferredWaveType}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="bg-black/30 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Account Settings</CardTitle>
              <CardDescription className="text-white/60">
                Manage your account preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="dark-mode" className="text-white">
                    Dark Mode
                  </Label>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="notifications" className="text-white">
                    Enable Notifications
                  </Label>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={savePreferences}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

