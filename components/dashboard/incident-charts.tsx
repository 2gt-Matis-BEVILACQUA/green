"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { Incident, Course } from "@/lib/types"

// Palette de couleurs élégante (vert golf, gris anthracite, bleu pro) - Charte Resonance
const CHART_COLORS = {
  primary: "#064e3b", // Vert golf foncé (Resonance)
  secondary: "#059669", // Vert golf moyen (Resonance)
  tertiary: "#10b981", // Vert golf clair
  accent: "#0ea5e9", // Bleu pro
  dark: "#1e293b", // Gris ardoise anthracite (Resonance)
  slate: "#475569", // Gris ardoise moyen
  emerald: {
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  blue: {
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
}

interface IncidentChartsProps {
  incidents: Incident[]
  courses: Course[]
}

export function IncidentCharts({ incidents, courses }: IncidentChartsProps) {
  // 1. Données pour le camembert (Répartition par Type)
  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    incidents.forEach((inc) => {
      categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1
    })
    
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }))
  }, [incidents])

  // Palette optimisée selon la charte Resonance
  const COLORS = [
    CHART_COLORS.primary,   // Vert golf foncé
    CHART_COLORS.secondary, // Vert golf moyen
    CHART_COLORS.tertiary,  // Vert golf clair
    CHART_COLORS.dark,      // Gris ardoise anthracite
    CHART_COLORS.slate,     // Gris ardoise moyen
  ]

  // 2. Données pour l'histogramme (Charge par Parcours)
  const courseData = useMemo(() => {
    const courseCounts: Record<string, number> = {}
    incidents.forEach((inc) => {
      const course = courses.find((c) => c.id === inc.course_id)
      const courseName = course?.name || "Inconnu"
      courseCounts[courseName] = (courseCounts[courseName] || 0) + 1
    })

    return Object.entries(courseCounts)
      .map(([name, value]) => ({
        name,
        incidents: value,
      }))
      .sort((a, b) => b.incidents - a.incidents)
  }, [incidents, courses])

  // 3. Données pour la courbe d'activité (30 derniers jours)
  const activityData = useMemo(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Créer un tableau pour les 30 derniers jours
    const days: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      days.push({ date: dateStr, count: 0 })
    }

    // Compter les incidents par jour
    incidents.forEach((inc) => {
      const incDate = new Date(inc.created_at).toISOString().split("T")[0]
      const dayIndex = days.findIndex((d) => d.date === incDate)
      if (dayIndex >= 0) {
        days[dayIndex].count++
      }
    })

    // Formater les dates pour l'affichage (JJ/MM)
    return days.map((day) => ({
      date: new Date(day.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      count: day.count,
    }))
  }, [incidents])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="font-semibold text-slate-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Camembert - Répartition par Type */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Répartition par Type</h3>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-slate-400">
            Aucune donnée disponible
          </div>
        )}
      </div>

      {/* Histogramme - Charge par Parcours */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Charge par Parcours</h3>
        {courseData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={courseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="incidents" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-slate-400">
            Aucune donnée disponible
          </div>
        )}
      </div>

      {/* Courbe d'Activité - 30 derniers jours */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Activité (30j)</h3>
        {activityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.accent}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS.accent, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-slate-400">
            Aucune donnée disponible
          </div>
        )}
      </div>
    </div>
  )
}

// Composant pour exporter les données (utilisé pour le PDF)
export function getChartDataForPDF(incidents: Incident[], courses: Course[]) {
  // Répartition par catégorie
  const categoryCounts: Record<string, number> = {}
  incidents.forEach((inc) => {
    categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1
  })

  // Charge par parcours
  const courseCounts: Record<string, number> = {}
  incidents.forEach((inc) => {
    const course = courses.find((c) => c.id === inc.course_id)
    const courseName = course?.name || "Inconnu"
    courseCounts[courseName] = (courseCounts[courseName] || 0) + 1
  })

  // Activité 30 jours
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const activityCounts: Record<string, number> = {}
  incidents.forEach((inc) => {
    const incDate = new Date(inc.created_at).toISOString().split("T")[0]
    if (incDate >= thirtyDaysAgo.toISOString().split("T")[0]) {
      activityCounts[incDate] = (activityCounts[incDate] || 0) + 1
    }
  })

  return {
    categories: categoryCounts,
    courses: courseCounts,
    activity: activityCounts,
  }
}