"use client"

import { Clock, Sun, Wind } from "lucide-react"
import { useState, useEffect } from "react"

interface HeaderWithWeatherProps {
  courseName: string
}

export function HeaderWithWeather({ courseName }: HeaderWithWeatherProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Simuler des données météo (à remplacer par une API réelle)
  const weather = {
    temperature: 18,
    wind: 12,
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white shadow-sm px-8 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#064e3b]">
          Exploitation Terrain - {courseName}
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Horloge */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            {currentTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Météo */}
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#1E293B]">
              {weather.temperature}°C
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">
              {weather.wind} km/h
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

