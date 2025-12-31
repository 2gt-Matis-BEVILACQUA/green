"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar"
import { HeaderWithWeather } from "@/components/dashboard/header-with-weather"
import { GaugeStatCard } from "@/components/dashboard/gauge-stat-card"
import { PremiumIncidentCard } from "@/components/dashboard/premium-incident-card"
import { HoleGrid } from "@/components/dashboard/hole-grid"
import { TrophyEmptyState } from "@/components/dashboard/trophy-empty-state"
import { IncidentDetailsSheet } from "@/components/dashboard/incident-details-sheet"
import { LiveActivityPanel } from "@/components/dashboard/live-activity-panel"
import { SegmentControl } from "@/components/ui/segment-control"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Activity, AlertTriangle, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Incident, IncidentCategory, Course, Priority } from "@/lib/types"
import confetti from "canvas-confetti"

type StatusFilter = "all" | "urgent" | "in_progress" | "resolved"

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState({
    activeIncidents: 0,
    urgentIncidents: 0,
    resolutionRate: 0,
    lastReleve: null as string | null,
  })
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedCategories, setSelectedCategories] = useState<IncidentCategory[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  const clubId = "00000000-0000-0000-0000-000000000001"

  // Charger les courses avec mémorisation du parcours sélectionné
  useEffect(() => {
    fetchCourses()
    // Restaurer le parcours sélectionné depuis localStorage
    const savedCourseId = localStorage.getItem("selectedCourseId")
    if (savedCourseId) {
      setSelectedCourseId(savedCourseId)
    }
  }, [])

  // Sauvegarder le parcours sélectionné dans localStorage
  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== "all") {
      localStorage.setItem("selectedCourseId", selectedCourseId)
    }
  }, [selectedCourseId])

  // Charger les incidents et stats
  useEffect(() => {
    if (courses.length > 0 && selectedCourseId === "all") {
      setSelectedCourseId(courses.find((c) => c.is_active)?.id || courses[0].id)
    }
  }, [courses])

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== "all") {
      fetchIncidents()
      fetchStats()
    }
  }, [selectedCourseId])

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== "all") {
      // Setup Supabase Realtime subscription avec reconnexion automatique
      const supabase = createClient()
      let channel = supabase
        .channel("incidents-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "incidents",
            filter: `course_id=eq.${selectedCourseId}`,
          },
          () => {
            fetchIncidents()
            fetchStats()
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setError(null)
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // Tentative de reconnexion
            setTimeout(() => {
              channel = supabase
                .channel("incidents-changes-retry")
                .on(
                  "postgres_changes",
                  {
                    event: "*",
                    schema: "public",
                    table: "incidents",
                    filter: `course_id=eq.${selectedCourseId}`,
                  },
                  () => {
                    fetchIncidents()
                    fetchStats()
                  }
                )
                .subscribe()
            }, 2000)
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedCourseId])

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)

  // Préparer les données pour la grille de trous
  const holesData = useMemo(() => {
    if (!selectedCourse) return []
    const holes = Array.from({ length: selectedCourse.hole_count }, (_, i) => ({
      number: i + 1,
      incident: filteredIncidents.find(
        (inc) =>
          inc.hole_number === i + 1 && inc.status !== "Resolved"
      ),
    }))
    return holes
  }, [selectedCourse, filteredIncidents])

  // Filtrer les incidents
  useEffect(() => {
    let filtered = [...incidents]

    // Filtre par parcours
    if (selectedCourseId !== "all") {
      filtered = filtered.filter((inc) => inc.course_id === selectedCourseId)
    }

    // Filtre par statut
    if (statusFilter === "urgent") {
      filtered = filtered.filter(
        (inc) =>
          (inc.status === "Open" || inc.status === "In_Progress") &&
          (inc.priority === "High" || inc.priority === "Critical")
      )
    } else if (statusFilter === "in_progress") {
      filtered = filtered.filter((inc) => inc.status === "In_Progress")
    } else if (statusFilter === "resolved") {
      filtered = filtered.filter((inc) => inc.status === "Resolved")
    } else {
      filtered = filtered.filter((inc) => inc.status !== "Resolved")
    }

    // Filtre par catégories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((inc) => selectedCategories.includes(inc.category))
    }

    // Filtre par onglet (trous)
    if (activeTab === "outgoing" && selectedCourse) {
      filtered = filtered.filter((inc) => inc.hole_number <= Math.ceil(selectedCourse.hole_count / 2))
    } else if (activeTab === "returning" && selectedCourse) {
      filtered = filtered.filter((inc) => inc.hole_number > Math.ceil(selectedCourse.hole_count / 2))
    }

    setFilteredIncidents(filtered)
  }, [incidents, selectedCourseId, statusFilter, selectedCategories, activeTab, selectedCourse])

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

  const fetchStats = async () => {
    try {
      setError(null)
      const url = selectedCourseId === "all"
        ? `/api/stats?club_id=${clubId}`
        : `/api/stats?club_id=${clubId}&course_id=${selectedCourseId}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Impossible de charger les statistiques")
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      // Erreur silencieuse pour les stats (non bloquante)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`/api/incidents/${id}/resolve`, {
        method: "POST",
      })

      if (response.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        toast({
          title: "Incident résolu! 🎉",
          description: "L'incident a été marqué comme résolu.",
        })

        setIsSheetOpen(false)
        fetchIncidents()
        fetchStats()
      } else {
        throw new Error("Erreur lors de la résolution")
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de résoudre l'incident. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsSheetOpen(true)
  }

  const handleHoleClick = (holeNumber: number) => {
    const incident = filteredIncidents.find(
      (inc) => inc.hole_number === holeNumber && inc.status !== "Resolved"
    )
    if (incident) {
      handleViewDetails(incident)
    }
  }

  // Données pour les sparklines
  const weeklyData = [12, 8, 15, 10, 6, 9, 7]

  // Incidents récents pour le panneau d'activité
  const recentIncidents = useMemo(() => {
    return incidents
      .filter((inc) => inc.status !== "Resolved")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }, [incidents])

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      <PremiumSidebar />
      <div className="lg:ml-64 flex flex-1 flex-col overflow-hidden">
        <HeaderWithWeather courseName={selectedCourse?.name || "Tous les parcours"} />
        
        {/* Top Navigation avec sélecteur de parcours */}
        <div className="border-b border-slate-200 bg-white shadow-sm px-8 py-4">
          <div className="flex items-center justify-between">
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
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-8">
              {/* Stats Cards avec Jauges */}
              {loading ? (
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : error ? (
                <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
                  <p className="text-sm text-[#475569]">{error}</p>
                </div>
              ) : (
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                  <GaugeStatCard
                    title="Santé du Parcours"
                    value={stats.activeIncidents}
                    max={selectedCourse?.hole_count || 18}
                    icon={Activity}
                    gaugeType="circular"
                    color="#064e3b"
                    description={`${(selectedCourse?.hole_count || 18) - stats.activeIncidents} trous parfaits`}
                  />
                  <GaugeStatCard
                    title="Urgences"
                    value={stats.urgentIncidents}
                    max={stats.activeIncidents || 1}
                    icon={AlertTriangle}
                    gaugeType="sparkline"
                    sparklineData={weeklyData}
                    color="#E0115F"
                    description="Nécessitent une attention immédiate"
                  />
                  <GaugeStatCard
                    title="Résolus (24h)"
                    value={stats.resolutionRate}
                    max={100}
                    icon={TrendingUp}
                    gaugeType="circular"
                    color="#D4AF37"
                    description="Taux de résolution"
                  />
                </div>
              )}

              {/* Navigation par Onglets */}
              {selectedCourseId !== "all" && selectedCourse && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                  <TabsList>
                    <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                    <TabsTrigger value="outgoing">
                      Aller : Trous 1-{Math.ceil(selectedCourse.hole_count / 2)}
                    </TabsTrigger>
                    <TabsTrigger value="returning">
                      Retour : Trous {Math.ceil(selectedCourse.hole_count / 2) + 1}-{selectedCourse.hole_count}
                    </TabsTrigger>
                  </TabsList>

                  {/* Vue d'ensemble */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                      <h2 className="mb-4 text-lg font-semibold text-[#064e3b]">
                        Vue d&apos;ensemble - {selectedCourse.name}
                      </h2>
                      <HoleGrid
                        holes={holesData}
                        maxHoles={selectedCourse.hole_count}
                        onHoleClick={handleHoleClick}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="outgoing" className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                      <h2 className="mb-4 text-lg font-semibold text-[#064e3b]">
                        Aller : Trous 1-{Math.ceil(selectedCourse.hole_count / 2)}
                      </h2>
                      <HoleGrid
                        holes={holesData.slice(0, Math.ceil(selectedCourse.hole_count / 2))}
                        maxHoles={Math.ceil(selectedCourse.hole_count / 2)}
                        onHoleClick={handleHoleClick}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="returning" className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                      <h2 className="mb-4 text-lg font-semibold text-[#064e3b]">
                        Retour : Trous {Math.ceil(selectedCourse.hole_count / 2) + 1}-{selectedCourse.hole_count}
                      </h2>
                      <HoleGrid
                        holes={holesData.slice(Math.ceil(selectedCourse.hole_count / 2))}
                        maxHoles={selectedCourse.hole_count - Math.ceil(selectedCourse.hole_count / 2)}
                        onHoleClick={handleHoleClick}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Filtres */}
              <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1E293B]">Filtres</h3>
                </div>
                <div className="space-y-4">
                  <SegmentControl
                    options={[
                      { value: "all", label: "Tous" },
                      { value: "urgent", label: "Urgents" },
                      { value: "in_progress", label: "En cours" },
                      { value: "resolved", label: "Résolus" },
                    ]}
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  />
                </div>
              </div>

              {/* Liste des incidents */}
              <div>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2E8F0] pb-4">
                  <h2 className="text-xl font-semibold tracking-tight text-[#0F172A]">
                    Flux d&apos;incidents
                  </h2>
                  <span className="text-sm text-[#475569]">
                    {filteredIncidents.length} incident{filteredIncidents.length > 1 ? "s" : ""}
                  </span>
                </div>

                {loading ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-64 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="mb-4 h-12 w-12 text-[#475569]" />
                    <p className="text-sm text-[#475569]">{error}</p>
                    <Button
                      onClick={() => {
                        setError(null)
                        fetchIncidents()
                        fetchStats()
                      }}
                      className="mt-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-700 border border-emerald-900/20 shadow-md"
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : filteredIncidents.length === 0 ? (
                  <TrophyEmptyState courseName={selectedCourse?.name} />
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredIncidents.map((incident, index) => (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <PremiumIncidentCard
                            id={incident.id}
                            holeNumber={incident.hole_number}
                            category={incident.category}
                            description={incident.description}
                            photoUrl={incident.photo_url}
                            priority={incident.priority}
                            createdAt={new Date(incident.created_at)}
                            onViewDetails={() => handleViewDetails(incident)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </main>

          {/* Right Panel - Live Activity */}
          <div className="hidden lg:block w-80 border-l border-slate-200 bg-[#F1F5F9] p-6">
            <LiveActivityPanel recentIncidents={recentIncidents} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <IncidentDetailsSheet
        incident={selectedIncident}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onResolve={handleResolve}
      />

      <Toaster />
    </div>
  )
}
