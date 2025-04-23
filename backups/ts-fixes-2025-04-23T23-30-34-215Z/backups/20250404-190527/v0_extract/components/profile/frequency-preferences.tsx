"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/components/auth/auth-provider"
import { Save, Plus, X } from "lucide-react"

interface FrequencyPreferencesProps {
  favoriteFrequencies: number[]
  preferredWaveType: string
}

export function FrequencyPreferences({ favoriteFrequencies, preferredWaveType }: FrequencyPreferencesProps) {
  const { updatePreferences } = useAuth()
  const [frequencies, setFrequencies] = useState<number[]>(favoriteFrequencies)
  const [waveType, setWaveType] = useState<string>(preferredWaveType)
  const [newFrequency, setNewFrequency] = useState<number>(432)
  const [isSaving, setIsSaving] = useState(false)

  const addFrequency = () => {
    if (!frequencies.includes(newFrequency)) {
      setFrequencies([...frequencies, newFrequency])
    }
  }

  const removeFrequency = (freq: number) => {
    setFrequencies(frequencies.filter((f) => f !== freq))
  }

  const savePreferences = async () => {
    setIsSaving(true)

    try {
      updatePreferences({
        favoriteFrequencies: frequencies,
        preferredWaveType: waveType,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-black/30 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Frequency Preferences</CardTitle>
        <CardDescription className="text-white/60">Customize your healing frequency experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-white font-medium mb-3">Preferred Wave Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["sine", "square", "triangle", "sawtooth"].map((type) => (
              <Button
                key={type}
                variant="outline"
                className={`border-white/10 text-white hover:bg-white/5 ${
                  waveType === type ? "bg-purple-500/20 border-purple-500" : ""
                }`}
                onClick={() => setWaveType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white font-medium mb-3">Favorite Frequencies</h3>

          {frequencies.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {frequencies.map((freq) => (
                <div key={freq} className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                  <span className="text-white">{freq} Hz</span>
                  <button onClick={() => removeFrequency(freq)} className="text-white/60 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 mb-4">No favorite frequencies added yet</p>
          )}

          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white/60 text-sm">New Frequency (Hz)</label>
                <span className="text-white">{newFrequency} Hz</span>
              </div>
              <Slider
                value={[newFrequency]}
                min={20}
                max={20000}
                step={1}
                onValueChange={(value) => setNewFrequency(value[0])}
              />
            </div>
            <Button onClick={addFrequency} variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
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
              Save Preferences
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

