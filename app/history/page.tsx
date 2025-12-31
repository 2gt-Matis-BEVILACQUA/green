"use client"

import { useState, useEffect, useMemo } from "react"
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { History, AlertTriangle, Calendar, Filter, Download } from "lucide-react"
import { Incident, Course, IncidentCategory } from "@/lib/types"
import { formatTimeAgo } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { PremiumIncidentCard } from "@/components/dashboard/premium-incident-card"
import { IncidentDetailsSheet } from "@/components/dashboard/incident-details-sheet"
import { Toaster } from "@/components/ui/toaster"

const clubId = "00000000-0000-0000-0000-000000000001"

export default function HistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
    fetchResolvedIncidents()
    
    // Restaurer les filtres depuis localStorage
    const savedCourseId = localStorage.getItem("historySelectedCourseId")
    if (savedCourseId) setSelectedCourseId(savedCourseId)
  }, [])

  useEffect(() => {
    if (selectedCourseId !== "all") {
      localStorage.setItem("historySelectedCourseId", selectedCourseId)
    }
  }, [selectedCourseId])

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/courses?club_id=${clubId}&active_only=false`)
      if (!response.ok) throw new Error("Erreur de chargement")
      const data = await response.json()
      setCourses(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les parcours.",
        variant: "destructive",
      })
    }
  }

  const fetchResolvedIncidents = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch(`/api/incidents?club_id=${clubId}&status=Resolved`)
      if (!response.ok) throw new Error("Impossible de charger les incidents")
      const data = await response.json()
      setIncidents(data)
    } catch (error) {
      setError("Erreur de connexion à la base de données")
      toast({
        title: "Erreur",
        description: "Impossible de charger les archives. Vérifiez votre connexion.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les incidents
  useEffect(() => {
    let filtered = [...incidents]

    // Filtre par parcours
    if (selectedCourseId !== "all") {
      filtered = filtered.filter((inc) => inc.course_id === selectedCourseId)
    }

    // Filtre par catégorie
    if (selectedCategory !== "all") {
      filtered = filtered.filter((inc) => inc.category === selectedCategory)
    }

    // Filtre par date
    if (dateRange !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "3months":
          filterDate.setMonth(now.getMonth() - 3)
          break
      }
      
      filtered = filtered.filter((inc) => {
        const resolvedDate = inc.resolved_at ? new Date(inc.resolved_at) : new Date(inc.created_at)
        return resolvedDate >= filterDate
      })
    }

    // Trier par date de résolution (plus récent en premier)
    filtered.sort((a, b) => {
      const dateA = a.resolved_at ? new Date(a.resolved_at) : new Date(a.created_at)
      const dateB = b.resolved_at ? new Date(b.resolved_at) : new Date(b.created_at)
      return dateB.getTime() - dateA.getTime()
    })

    setFilteredIncidents(filtered)
  }, [incidents, selectedCourseId, selectedCategory, dateRange])

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsSheetOpen(true)
  }

  const categories: IncidentCategory[] = ["Arrosage", "Tonte", "Bunker", "Signaletique", "Autre"]
  const selectedCourse = courses.find((c) => c.id === selectedCourseId)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      <PremiumSidebar />
      <div className="lg:ml-64 flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-[#064e3b]">Archives</h1>
              <p className="mt-1 text-sm text-slate-600">
                Consultation de l&apos;historique des incidents résolus
              </p>
            </div>

            {/* Filtres */}
            <Card className="mb-6 border border-slate-200 bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1E293B]">
                  <Filter className="h-5 w-5" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Parcours
                    </label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="border-2 border-slate-300 bg-white text-slate-900 shadow-sm hover:border-[#064e3b]/30 focus:border-[#064e3b]">
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

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Catégorie
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-2 border-slate-300 bg-white text-slate-900 shadow-sm hover:border-[#064e3b]/30 focus:border-[#064e3b]">
                        <SelectValue placeholder="Toutes les catégories">
                          {selectedCategory === "all"
                            ? "Toutes les catégories"
                            : categories.find((c) => c === selectedCategory) || "Toutes les catégories"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1E293B]">
                      Période
                    </label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="border-2 border-slate-300 bg-white text-slate-900 shadow-sm hover:border-[#064e3b]/30 focus:border-[#064e3b]">
                        <SelectValue placeholder="Toutes les périodes">
                          {dateRange === "all"
                            ? "Toutes les périodes"
                            : dateRange === "today"
                            ? "Aujourd'hui"
                            : dateRange === "week"
                            ? "7 derniers jours"
                            : dateRange === "month"
                            ? "30 derniers jours"
                            : dateRange === "3months"
                            ? "3 derniers mois"
                            : "Toutes les périodes"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                        <SelectItem value="week">7 derniers jours</SelectItem>
                        <SelectItem value="month">30 derniers jours</SelectItem>
                        <SelectItem value="3months">3 derniers mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <Card className="border border-slate-200 bg-white shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total résolu</p>
                      <p className="text-2xl font-semibold text-[#1E293B]">
                        {filteredIncidents.length}
                      </p>
                    </div>
                    <History className="h-8 w-8 text-[#064e3b]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Résolu aujourd&apos;hui</p>
                      <p className="text-2xl font-semibold text-[#1E293B]">
                        {filteredIncidents.filter((inc) => {
                          const resolvedDate = inc.resolved_at
                            ? new Date(inc.resolved_at)
                            : new Date(inc.created_at)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return resolvedDate >= today
                        }).length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-[#064e3b]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Résolu cette semaine</p>
                      <p className="text-2xl font-semibold text-[#1E293B]">
                        {filteredIncidents.filter((inc) => {
                          const resolvedDate = inc.resolved_at
                            ? new Date(inc.resolved_at)
                            : new Date(inc.created_at)
                          const weekAgo = new Date()
                          weekAgo.setDate(weekAgo.getDate() - 7)
                          return resolvedDate >= weekAgo
                        }).length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-[#064e3b]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des incidents résolus */}
            <Card className="border border-slate-200 bg-white shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-[#064e3b]">
                      <History className="h-5 w-5" />
                      Incidents résolus
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {filteredIncidents.length} incident{filteredIncidents.length > 1 ? "s" : ""} résolu
                      {filteredIncidents.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                        fetchResolvedIncidents()
                      }}
                      className="mt-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-700 border border-emerald-900/20 shadow-md"
                    >
                      Réessayer
                    </Button>
                  </div>
                ) : filteredIncidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="mb-4 h-12 w-12 text-[#475569]" />
                    <p className="text-sm font-medium text-[#0F172A]">Aucun incident résolu</p>
                    <p className="mt-1 text-sm text-[#475569]">
                      {selectedCourseId !== "all" || selectedCategory !== "all" || dateRange !== "all"
                        ? "Aucun incident ne correspond aux filtres sélectionnés."
                        : "Aucun incident n&apos;a encore été résolu."}
                    </p>
                  </div>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modal détails */}
      <IncidentDetailsSheet
        incident={selectedIncident}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />

      <Toaster />
    </div>
  )
}
