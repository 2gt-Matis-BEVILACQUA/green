"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar"
import { HeaderWithWeather } from "@/components/dashboard/header-with-weather"
import { CourseHealthGauge } from "@/components/dashboard/course-health-gauge"
import { IncidentFlowCardWide } from "@/components/dashboard/incident-flow-card-wide"
import { HoleStatusGrid } from "@/components/dashboard/hole-status-grid"
import { MultiCourseGrid } from "@/components/dashboard/multi-course-grid"
import { IncidentDrawer } from "@/components/dashboard/incident-drawer"
import { PriorityBadge } from "@/components/dashboard/priority-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react"
import { ExportModal } from "@/components/dashboard/export-modal"
import { IncidentCharts } from "@/components/dashboard/incident-charts"
import { createClient } from "@/lib/supabase/client"
import { Incident, Course, Priority } from "@/lib/types"
import confetti from "canvas-confetti"
import { ChartBarIcon, ChevronDown } from "lucide-react"

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<Priority | "all">("all")
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const clubId = "00000000-0000-0000-0000-000000000001"

  // Charger les courses
  useEffect(() => {
    fetchCourses()
    const savedCourseId = localStorage.getItem("selectedCourseId")
    if (savedCourseId) {
      setSelectedCourseId(savedCourseId)
    }
  }, [])

  useEffect(() => {
    if (selectedCourseId) {
      localStorage.setItem("selectedCourseId", selectedCourseId)
    }
  }, [selectedCourseId])

  // Ne pas changer automatiquement si "all" est déjà sélectionné
  // useEffect(() => {
  //   if (courses.length > 0 && selectedCourseId === "all") {
  //     setSelectedCourseId(courses.find((c) => c.is_active)?.id || courses[0].id)
  //   }
  // }, [courses])

  useEffect(() => {
    fetchIncidents()
  }, [selectedCourseId])

  useEffect(() => {
    const supabase = createClient()
    let channel = supabase
      .channel("incidents-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
          filter: selectedCourseId === "all" 
            ? `club_id=eq.${clubId}`
            : `course_id=eq.${selectedCourseId}`,
        },
        () => {
          fetchIncidents()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedCourseId])

  // Filtrer les incidents (seulement non résolus + par priorité)
  useEffect(() => {
    let filtered = incidents.filter((inc) => inc.status !== "Resolved")
    if (selectedCourseId !== "all") {
      filtered = filtered.filter((inc) => inc.course_id === selectedCourseId)
    }
    if (selectedPriority !== "all") {
      filtered = filtered.filter((inc) => inc.priority === selectedPriority)
    }
    // Trier par date décroissante
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setFilteredIncidents(filtered)
  }, [incidents, selectedCourseId, selectedPriority])

  // Calculer les stats
  const stats = useMemo(() => {
    const activeIncidents = filteredIncidents.filter((inc) => inc.status !== "Resolved")
    const newIncidents = filteredIncidents.filter((inc) => inc.status === "Open")
    
    // Si "Tous les parcours" est sélectionné, calculer la somme totale
    let totalHoles: number
    let operationalHoles: number
    
    if (selectedCourseId === "all") {
      // Somme de tous les trous des parcours actifs
      const activeCourses = courses.filter((c) => c.is_active)
      totalHoles = activeCourses.reduce((sum, course) => sum + course.hole_count, 0)
      operationalHoles = totalHoles - activeIncidents.length
    } else {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId)
      totalHoles = selectedCourse?.hole_count || 18
      operationalHoles = totalHoles - activeIncidents.length
    }
    
    const operationalPercentage = totalHoles > 0 
      ? Math.round((operationalHoles / totalHoles) * 100)
      : 100

    // Photos reçues 24h
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const photos24h = filteredIncidents.filter(
      (inc) =>
        inc.photo_url &&
        new Date(inc.created_at) >= yesterday
    ).length

    // Temps de résolution moyen (en heures)
    const resolvedIncidents = incidents.filter((inc) => inc.status === "Resolved" && inc.resolved_at)
    let avgResolutionTime: string | null = null
    
    if (resolvedIncidents.length > 0) {
      const totalMinutes = resolvedIncidents.reduce((sum, inc) => {
        if (inc.resolved_at) {
          const created = new Date(inc.created_at).getTime()
          const resolved = new Date(inc.resolved_at).getTime()
          const diffMinutes = (resolved - created) / (1000 * 60)
          return sum + diffMinutes
        }
        return sum
      }, 0)
      
      const avgMinutes = totalMinutes / resolvedIncidents.length
      const hours = Math.floor(avgMinutes / 60)
      const minutes = Math.round(avgMinutes % 60)
      avgResolutionTime = `${hours}h${minutes.toString().padStart(2, "0")}`
    }

    return {
      operationalPercentage,
      operationalHoles,
      totalHoles,
      newIncidents: newIncidents.length,
      photos24h,
      avgResolutionTime,
    }
  }, [filteredIncidents, incidents, courses, selectedCourseId])

  const fetchCourses = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/courses?club_id=${clubId}&active_only=false`)
      if (!response.ok) {
        throw new Error("Impossible de charger les parcours")
      }
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      setError("Erreur de connexion à la base de données")
      toast({
        title: "Erreur",
        description: "Impossible de charger les parcours. Vérifiez votre connexion.",
        variant: "destructive",
      })
    }
  }

  const fetchIncidents = async () => {
    try {
      setError(null)
      setLoading(true)
      const url = selectedCourseId === "all"
        ? `/api/incidents?club_id=${clubId}`
        : `/api/incidents?club_id=${clubId}&course_id=${selectedCourseId}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Impossible de charger les incidents")
      }
      const data = await response.json()
      setIncidents(data)
    } catch (error) {
      setError("Erreur de connexion à la base de données")
      toast({
        title: "Erreur",
        description: "Impossible de charger les incidents. Vérifiez votre connexion.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsDrawerOpen(true)
  }

  const handleHoleClick = (holeNumber: number, courseId?: string) => {
    const incident = filteredIncidents.find(
      (inc) => 
        inc.hole_number === holeNumber && 
        inc.status !== "Resolved" &&
        (courseId ? inc.course_id === courseId : true)
    )
    if (incident) {
      handleIncidentClick(incident)
    }
  }

  const handleTreat = async (incident: Incident) => {
    try {
      const response = await fetch(`/api/incidents/${incident.id}/resolve`, {
        method: "POST",
      })
      if (response.ok) {
        // Animation de célébration
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#064e3b", "#10b981"],
        })
        
        toast({
          title: "Incident traité",
          description: "L'incident a été marqué comme résolu.",
        })
        fetchIncidents()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'incident.",
        variant: "destructive",
      })
    }
  }

  const handleArchive = async (incident: Incident) => {
    try {
      const response = await fetch(`/api/incidents/${incident.id}/resolve`, {
        method: "POST",
      })
      if (response.ok) {
        toast({
          title: "Incident archivé",
          description: "L'incident a été archivé.",
        })
        fetchIncidents()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver l'incident.",
        variant: "destructive",
      })
    }
  }

  const handleUrgent = async (incident: Incident) => {
    try {
      const response = await fetch(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "Critical" }),
      })
      if (response.ok) {
        toast({
          title: "Priorité mise à jour",
          description: "L'incident a été marqué comme critique.",
        })
        fetchIncidents()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la priorité.",
        variant: "destructive",
      })
    }
  }

  const handleSaveNote = useCallback(async (incidentId: string, note: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}/note`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde")
      }

      // Mettre à jour l'incident dans la liste locale
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId ? { ...inc, internal_note: note } : inc
        )
      )
    } catch (error) {
      // Erreur silencieuse pour la sauvegarde auto
    }
  }, [])

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const newIncidentsCount = filteredIncidents.filter((inc) => inc.status === "Open").length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen overflow-hidden bg-slate-50 font-sans"
    >
      <PremiumSidebar 
        newIncidentsCount={newIncidentsCount} 
        onExportClick={() => setIsExportModalOpen(true)}
      />
      <div className="lg:ml-64 flex flex-1 flex-col overflow-hidden">
        <HeaderWithWeather 
          courseName={
            selectedCourseId === "all" 
              ? "État Global du Domaine" 
              : selectedCourse?.name || "Tous les parcours"
          } 
        />
        
        {/* Top Navigation */}
        <div className="border-b border-slate-200 bg-white shadow-sm px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-[280px] border-2 border-slate-300 bg-white text-slate-900 shadow-sm hover:border-[#064e3b]/30 focus:border-[#064e3b]">
                  <SelectValue placeholder="Sélectionner un parcours">
                    {selectedCourseId === "all"
                      ? "Tous les parcours"
                      : selectedCourse?.name || "Sélectionner un parcours"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les parcours</SelectItem>
                  {courses
                    .filter((c) => c.is_active)
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.hole_count} trous)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre de Priorité */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Priorité:</span>
              <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as Priority | "all")}>
                <SelectTrigger className="w-[160px] border-2 border-slate-300 bg-white text-slate-900 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="Critical">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority="Critical" />
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority="High" />
                    </div>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority="Medium" />
                    </div>
                  </SelectItem>
                  <SelectItem value="Low">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority="Low" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Bouton Analyse Avancée */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
                className="ml-2 flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-[#064e3b]/30"
              >
                <ChartBarIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Analyse Avancée</span>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${showAdvancedAnalysis ? 'rotate-180' : ''}`} 
                />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-8 py-6">
            {/* KPI Header - 3 Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {/* Carte 1: Santé du Parcours */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-4 text-sm font-medium text-slate-600">Santé du Parcours</p>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <CourseHealthGauge
                    operationalPercentage={stats.operationalPercentage}
                    operationalHoles={stats.operationalHoles}
                    totalHoles={stats.totalHoles}
                  />
                )}
              </motion.div>

              {/* Carte 2: Alertes Actives */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-4 text-sm font-medium text-slate-600">Alertes Actives</p>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : stats.newIncidents > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-red-600">{stats.newIncidents}</p>
                      <p className="text-sm text-slate-600">Incidents nouveaux</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Aucune urgence</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Carte 3: Activité WhatsApp */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="mb-4 text-sm font-medium text-slate-600">Activité WhatsApp</p>
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                      <ImageIcon className="h-8 w-8 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900">{stats.photos24h}</p>
                      <p className="text-sm text-slate-600">Photos reçues (24h)</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Section Analyse Avancée - Escamotable */}
            <AnimatePresence>
              {showAdvancedAnalysis && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Analyses Détaillées</h3>
                    <IncidentCharts incidents={incidents} courses={courses} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Grid - 2 Columns */}
            <div className="grid grid-cols-12 gap-6">
              {/* Colonne Gauche - Flux d'incidents (span 8) */}
              <div className="col-span-12 lg:col-span-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Flux Terrain
                  </h2>
                  <span className="text-sm text-slate-500">
                    {filteredIncidents.length} incident{filteredIncidents.length > 1 ? "s" : ""}
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <p className="text-sm text-slate-600">{error}</p>
                  </div>
                ) : filteredIncidents.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                    <p className="text-sm text-slate-500">Aucun incident pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredIncidents.map((incident, index) => (
                      <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <IncidentFlowCardWide
                          incident={incident}
                          onClick={() => handleIncidentClick(incident)}
                          onTreat={() => handleTreat(incident)}
                          onArchive={() => handleArchive(incident)}
                          onUrgent={() => handleUrgent(incident)}
                          courseName={
                            selectedCourseId === "all"
                              ? courses.find((c) => c.id === incident.course_id)?.name
                              : undefined
                          }
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Colonne Droite - Contrôle et Export (span 4) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* Vue interactive des trous */}
                {selectedCourseId === "all" ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">
                      État des Parcours
                    </h3>
                    <div className="max-h-[600px] overflow-y-auto">
                      <MultiCourseGrid
                        courses={courses}
                        incidents={filteredIncidents}
                        onHoleClick={handleHoleClick}
                      />
                    </div>
                  </div>
                ) : selectedCourse ? (
                  <HoleStatusGrid
                    totalHoles={selectedCourse.hole_count}
                    incidents={filteredIncidents}
                    onHoleClick={(holeNumber) => handleHoleClick(holeNumber)}
                  />
                ) : null}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Drawer */}
      <IncidentDrawer
        incident={selectedIncident}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaveNote={handleSaveNote}
        onPhotoUploaded={() => {
          fetchIncidents()
        }}
      />

      {/* Export Modal */}
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        courses={courses}
        clubName={selectedCourse?.name || "TerrainSync"}
      />
      <Toaster />
    </motion.div>
  )
}
