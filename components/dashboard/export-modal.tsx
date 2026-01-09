"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { FileText, Download, Calendar, Map, X, Clock, CheckCircle2, Table2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Course } from "@/lib/types"

interface ExportHistory {
  id: string
  type: "PDF" | "Excel"
  reportType?: "synthetic" | "detailed"
  period: string
  courses: string[]
  generatedAt: string
  generatedBy: string
}

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: Course[]
  clubName?: string
}

export function ExportModal({ open, onOpenChange, courses, clubName = "TerrainSync" }: ExportModalProps) {
  const [datePreset, setDatePreset] = useState<"today" | "7days" | "lastMonth" | "custom">("7days")
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set(["all"]))
  const [includeOpen, setIncludeOpen] = useState(true)
  const [includeResolved, setIncludeResolved] = useState(true)
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [reportType, setReportType] = useState<"synthetic" | "detailed">("detailed")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStep, setProgressStep] = useState("")
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("exportHistory")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // S'assurer que chaque entrée a un tableau courses valide et mettre à jour le nom
        const validated = parsed.map((entry: any) => ({
          ...entry,
          courses: Array.isArray(entry.courses) ? entry.courses : ["Tous les parcours"],
          // Mettre à jour "Alain Egloff" vers "Matis Bevilacqua" dans les anciennes entrées
          generatedBy: entry.generatedBy === "Alain Egloff" ? "Matis Bevilacqua" : entry.generatedBy,
        }))
        
        // Si des entrées ont été modifiées, sauvegarder
        const hasChanges = parsed.some((entry: any, index: number) => 
          entry.generatedBy === "Alain Egloff" && validated[index].generatedBy === "Matis Bevilacqua"
        )
        
        if (hasChanges) {
          localStorage.setItem("exportHistory", JSON.stringify(validated))
        }
        
        setExportHistory(validated)
      } catch (e) {
        // Ignore
      }
    }
  }, [])

  // Mettre à jour les dates selon le preset
  useEffect(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    switch (datePreset) {
      case "today":
        setStartDate(new Date(today.setHours(0, 0, 0, 0)))
        setEndDate(new Date())
        break
      case "7days":
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)
        setStartDate(sevenDaysAgo)
        setEndDate(new Date())
        break
      case "lastMonth":
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        lastMonth.setDate(1)
        lastMonth.setHours(0, 0, 0, 0)
        const lastDayOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
        lastDayOfMonth.setHours(23, 59, 59, 999)
        setStartDate(lastMonth)
        setEndDate(lastDayOfMonth)
        break
      case "custom":
        // Les dates restent telles quelles
        break
    }
  }, [datePreset])

  const toggleCourse = (courseId: string) => {
    const newSet = new Set(selectedCourseIds)
    if (courseId === "all") {
      if (newSet.has("all")) {
        newSet.clear()
      } else {
        newSet.clear()
        newSet.add("all")
      }
    } else {
      newSet.delete("all")
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
        if (newSet.size === 0) {
          newSet.add("all")
        }
      } else {
        newSet.add(courseId)
      }
    }
    setSelectedCourseIds(newSet)
  }

  const simulateProgress = (steps: string[]) => {
    return new Promise<void>((resolve) => {
      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setProgressStep(steps[currentStep])
          setProgress(((currentStep + 1) / steps.length) * 100)
          currentStep++
        } else {
          clearInterval(interval)
          resolve()
        }
      }, 600)
    })
  }

  const addToHistory = (type: "PDF" | "Excel", period: string) => {
    const selectedCourses = selectedCourseIds.has("all")
      ? ["Tous les parcours"]
      : Array.from(selectedCourseIds)
          .map((id) => courses.find((c) => c.id === id)?.name)
          .filter(Boolean) as string[]

    const newEntry: ExportHistory = {
      id: Date.now().toString(),
      type,
      reportType: type === "PDF" ? reportType : undefined,
      period,
      courses: selectedCourses.length > 0 ? selectedCourses : ["Tous les parcours"],
      generatedAt: new Date().toISOString(),
      generatedBy: "Matis Bevilacqua",
    }
    const updated = [newEntry, ...exportHistory].slice(0, 10)
    setExportHistory(updated)
    localStorage.setItem("exportHistory", JSON.stringify(updated))
  }

  const handleExportPDF = async () => {
    setIsGenerating(true)
    setProgress(0)
    setProgressStep("Génération du rapport de direction en cours...")

    const steps = [
      "Génération du rapport de direction en cours...",
      "Compilation des données...",
      "Filtrage des incidents...",
      reportType === "detailed" ? "Optimisation des photos..." : "Génération des graphiques...",
      "Génération du document...",
      "Rapport prêt !",
    ]

    await simulateProgress(steps)

    try {
      const courseIds = selectedCourseIds.has("all") || selectedCourseIds.size === 0
        ? "all" 
        : Array.from(selectedCourseIds).filter(Boolean).join(",")
      
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          courseId: courseIds,
          includeOpen,
          includeResolved,
          urgentOnly,
          includePhotos: reportType === "detailed" ? includePhotos : false,
          includeNotes: reportType === "detailed" ? includeNotes : false,
          clubName,
          reportType,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Rapport_TerrainSync_${format(new Date(), "yyyy-MM-dd")}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        const period = `${format(startDate, "d MMM yyyy", { locale: fr })} - ${format(endDate, "d MMM yyyy", { locale: fr })}`
        addToHistory("PDF", period)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error)
    } finally {
      setIsGenerating(false)
      setProgress(0)
      setProgressStep("")
    }
  }

  const handleExportExcel = async () => {
    setIsGenerating(true)
    setProgress(0)
    setProgressStep("Préparation du tableau Excel...")

    const steps = [
      "Préparation du tableau Excel...",
      "Compilation des données...",
      "Filtrage des incidents...",
      "Structuration du tableau...",
      "Export prêt !",
    ]

    await simulateProgress(steps)

    try {
      const courseIds = selectedCourseIds.has("all") || selectedCourseIds.size === 0
        ? "all" 
        : Array.from(selectedCourseIds).filter(Boolean).join(",")
      
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          courseId: courseIds,
          includeOpen,
          includeResolved,
          urgentOnly,
          includeNotes,
          clubName,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const contentDisposition = response.headers.get("content-disposition")
        const fileName = contentDisposition
          ? contentDisposition.split('filename="')[1]?.split('"')[0] || `Rapport_TerrainSync_${format(new Date(), "yyyy-MM-dd")}.xlsx`
          : `Rapport_TerrainSync_${format(new Date(), "yyyy-MM-dd")}.xlsx`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        const period = `${format(startDate, "d MMM yyyy", { locale: fr })} - ${format(endDate, "d MMM yyyy", { locale: fr })}`
        addToHistory("Excel", period)
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error)
    } finally {
      setIsGenerating(false)
      setProgress(0)
      setProgressStep("")
    }
  }

  const activeCourses = courses.filter((c) => c.is_active)
  const hasSelection = includeOpen || includeResolved

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          {/* Overlay avec backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isGenerating && onOpenChange(false)}
            className="absolute inset-0"
          />

          {/* Modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative mx-auto w-full max-w-2xl bg-white shadow-2xl overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Générer un Rapport d&apos;Exploitation</h2>
                    <p className="mt-1 text-sm text-slate-500">Configurez précisément les données à inclure</p>
                  </div>
                </div>
                <button
                  onClick={() => !isGenerating && onOpenChange(false)}
                  disabled={isGenerating}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-8 overflow-x-hidden">
                {/* Période */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <Label className="text-base font-bold text-slate-900">Période</Label>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: "today", label: "Aujourd'hui" },
                      { value: "7days", label: "7 derniers jours" },
                      { value: "lastMonth", label: "Mois dernier" },
                      { value: "custom", label: "Personnalisé" },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setDatePreset(preset.value as any)}
                        className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                          datePreset === preset.value
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {datePreset === "custom" && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-slate-600">Date de début</Label>
                        <input
                          type="date"
                          value={format(startDate, "yyyy-MM-dd")}
                          onChange={(e) => setStartDate(new Date(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs font-medium text-slate-600">Date de fin</Label>
                        <input
                          type="date"
                          value={format(endDate, "yyyy-MM-dd")}
                          onChange={(e) => setEndDate(new Date(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Périmètre */}
                <div>
                  <Label className="mb-4 block text-base font-bold text-slate-900">Périmètre</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="includeOpen"
                        checked={includeOpen}
                        onCheckedChange={(checked: boolean) => setIncludeOpen(checked)}
                        disabled={urgentOnly}
                      />
                      <Label htmlFor="includeOpen" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Incidents Ouverts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="includeResolved"
                        checked={includeResolved}
                        onCheckedChange={(checked: boolean) => setIncludeResolved(checked)}
                        disabled={urgentOnly}
                      />
                      <Label htmlFor="includeResolved" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Incidents Résolus
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="urgentOnly"
                        checked={urgentOnly}
                        onCheckedChange={(checked: boolean) => {
                          setUrgentOnly(checked)
                          if (checked) {
                            setIncludeOpen(false)
                            setIncludeResolved(false)
                          }
                        }}
                      />
                      <Label htmlFor="urgentOnly" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Urgences uniquement
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Localisation - Multi-select */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Map className="h-5 w-5 text-emerald-600" />
                    <Label className="text-base font-bold text-slate-900">Localisation</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleCourse("all")}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        selectedCourseIds.has("all")
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      Tous les parcours
                    </button>
                    {activeCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                          selectedCourseIds.has(course.id)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {course.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type de rapport (PDF uniquement) */}
                <div>
                  <Label className="mb-4 block text-base font-bold text-slate-900">Type de rapport (PDF)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setReportType("synthetic")}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        reportType === "synthetic"
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">Synthétique</div>
                      <div className="mt-1 text-xs text-slate-600">Chiffres et graphiques (1-2 pages)</div>
                    </button>
                    <button
                      onClick={() => setReportType("detailed")}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        reportType === "detailed"
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">Détaillé</div>
                      <div className="mt-1 text-xs text-slate-600">Historique complet avec photos et notes</div>
                    </button>
                  </div>
                </div>

                {/* Détails (PDF détaillé uniquement) */}
                {reportType === "detailed" && (
                  <div>
                    <Label className="mb-4 block text-base font-bold text-slate-900">Détails (PDF détaillé)</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="includePhotos"
                          checked={includePhotos}
                          onCheckedChange={(checked: boolean) => setIncludePhotos(checked)}
                        />
                        <Label htmlFor="includePhotos" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Inclure les photos dans le PDF
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="includeNotes"
                          checked={includeNotes}
                          onCheckedChange={(checked: boolean) => setIncludeNotes(checked)}
                        />
                        <Label htmlFor="includeNotes" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Inclure les notes internes
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Barre de progression */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">{progressStep}</span>
                        <span className="font-bold text-emerald-600">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Boutons d'export */}
                <div className="flex gap-4 pt-4 overflow-x-hidden">
                  <Button
                    onClick={handleExportPDF}
                    disabled={isGenerating || !hasSelection}
                    className="flex-1 min-w-0 bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-lg disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center min-w-0">
                      {isGenerating ? (
                        <>
                          <div className="mr-2 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="truncate">Génération... {Math.round(progress)}%</span>
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">PDF (Rapport de Direction)</span>
                        </>
                      )}
                    </span>
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    disabled={isGenerating || !hasSelection}
                    variant="outline"
                    className="flex-1 min-w-0 border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center min-w-0">
                      {isGenerating ? (
                        <>
                          <div className="mr-2 h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                          <span className="truncate">Préparation... {Math.round(progress)}%</span>
                        </>
                      ) : (
                        <>
                          <Table2 className="mr-2 h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">Export Excel (Tableur)</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>

                {/* Historique des exports */}
                {exportHistory.length > 0 && (
                  <div className="border-t border-slate-200 pt-6">
                    <Label className="mb-4 block text-base font-bold text-slate-900">Derniers rapports générés</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {exportHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {entry.type === "PDF" ? (
                              <FileText className="h-4 w-4 text-red-600" />
                            ) : (
                              <Table2 className="h-4 w-4 text-emerald-600" />
                            )}
                            <span className="font-medium text-slate-700">
                              {entry.type}
                              {entry.reportType && ` (${entry.reportType === "synthetic" ? "Synthétique" : "Détaillé"})`} - {entry.period}
                            </span>
                            {entry.courses && entry.courses.length > 0 && (
                              <span className="text-slate-500">
                                - {entry.courses.join(", ")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(entry.generatedAt), "d MMM yyyy à HH:mm", { locale: fr })} par {entry.generatedBy}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
