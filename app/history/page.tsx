"use client"

import { useState, useEffect, useMemo } from "react"
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Search, ChevronLeft, ChevronRight, Eye, Calendar } from "lucide-react"
import { Incident, Course, IncidentCategory, Priority } from "@/lib/types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "framer-motion"
import { IncidentDrawer } from "@/components/dashboard/incident-drawer"
import { Toaster } from "@/components/ui/toaster"
import { PriorityBadge } from "@/components/dashboard/priority-badge"

const clubId = "00000000-0000-0000-0000-000000000001"
const ITEMS_PER_PAGE = 10

export default function HistoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedHole, setSelectedHole] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
    fetchResolvedIncidents()
    
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

    // Filtre par trou
    if (selectedHole !== "all") {
      filtered = filtered.filter((inc) => inc.hole_number.toString() === selectedHole)
    }

    // Filtre par priorité
    if (selectedPriority !== "all") {
      filtered = filtered.filter((inc) => inc.priority === selectedPriority)
    }

    // Filtre par date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((inc) => {
        const incDate = inc.resolved_at ? new Date(inc.resolved_at) : new Date(inc.created_at)
        return incDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((inc) => {
        const incDate = inc.resolved_at ? new Date(inc.resolved_at) : new Date(inc.created_at)
        return incDate <= toDate
      })
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (inc) =>
          inc.description?.toLowerCase().includes(query) ||
          inc.hole_number.toString().includes(query) ||
          inc.category.toLowerCase().includes(query) ||
          inc.reported_by?.toLowerCase().includes(query)
      )
    }

    // Trier par date de résolution (plus récent en premier)
    filtered.sort((a, b) => {
      const dateA = a.resolved_at ? new Date(a.resolved_at) : new Date(a.created_at)
      const dateB = b.resolved_at ? new Date(b.resolved_at) : new Date(b.created_at)
      return dateB.getTime() - dateA.getTime()
    })

    setFilteredIncidents(filtered)
    setCurrentPage(1) // Reset à la page 1 quand les filtres changent
  }, [incidents, selectedCourseId, selectedCategory, selectedHole, selectedPriority, searchQuery, dateFrom, dateTo])

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE)
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredIncidents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredIncidents, currentPage])

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsDrawerOpen(true)
  }

  const handleSaveNote = async (incidentId: string, note: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      })
      if (response.ok) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === incidentId ? { ...inc, internal_note: note } : inc))
        )
      }
    } catch (error) {
      // Erreur silencieuse
    }
  }

  const categories: IncidentCategory[] = ["Arrosage", "Tonte", "Bunker", "Signaletique", "Autre"]
  const priorities: Priority[] = ["Critical", "High", "Medium", "Low"]
  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const holes = selectedCourse ? Array.from({ length: selectedCourse.hole_count }, (_, i) => i + 1) : []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen overflow-hidden bg-slate-50 font-sans"
    >
      <PremiumSidebar />
      <div className="lg:ml-64 flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-8 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-slate-900">Archives</h1>
              <p className="mt-2 text-sm text-slate-500">
                Consultation de l&apos;historique des incidents résolus
              </p>
            </motion.div>

            {/* Barre d'outils de filtrage avancée */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Filtres avancés</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Recherche plein texte */}
                <div className="lg:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Recherche plein texte
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Rechercher par mots-clés..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Date De */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date À */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {/* Parcours */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Parcours
                  </label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les parcours</SelectItem>
                      {courses
                        .filter((c) => c.is_active)
                        .map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Catégorie
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Toutes" />
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

                {/* Trou */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Trou
                  </label>
                  <Select value={selectedHole} onValueChange={setSelectedHole}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les trous</SelectItem>
                      {holes.map((hole) => (
                        <SelectItem key={hole} value={hole.toString()}>
                          Trou {hole}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priorité */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Priorité
                  </label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les priorités</SelectItem>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <PriorityBadge priority={priority} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {loading ? (
                <div className="p-8">
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-12 w-full mb-2" />
                  <Skeleton className="h-12 w-full mb-2" />
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-600">{error}</p>
                  <Button
                    onClick={fetchResolvedIncidents}
                    className="mt-4 bg-[#064e3b] text-white hover:bg-[#064e3b]/90 transition-all duration-200"
                  >
                    Réessayer
                  </Button>
                </div>
              ) : paginatedIncidents.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-medium text-slate-900">Aucun incident trouvé</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchQuery || selectedCategory !== "all" || selectedHole !== "all" || selectedPriority !== "all" || dateFrom || dateTo
                      ? "Aucun incident ne correspond aux filtres sélectionnés."
                      : "Aucun incident n&apos;a encore été résolu."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Trou</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedIncidents.map((incident, index) => {
                          const resolvedDate = incident.resolved_at
                            ? new Date(incident.resolved_at)
                            : new Date(incident.created_at)

                          return (
                            <motion.tr
                              key={incident.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              className="transition-colors hover:bg-slate-50"
                            >
                              <TableCell className="font-medium text-slate-900">
                                {format(resolvedDate, "d MMM yyyy", { locale: fr })}
                                <br />
                                <span className="text-xs text-slate-500">
                                  {format(resolvedDate, "HH:mm", { locale: fr })}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-2.5 py-1 text-sm font-bold text-white">
                                  {incident.hole_number}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-700">{incident.category}</TableCell>
                              <TableCell>
                                <PriorityBadge priority={incident.priority} />
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                  Résolu
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(incident)}
                                  className="text-slate-600 hover:text-slate-900 transition-all duration-200"
                                >
                                  <Eye className="mr-1.5 h-4 w-4" />
                                  Voir les détails
                                </Button>
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
                      <p className="text-sm text-slate-500">
                        Page {currentPage} sur {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-slate-300 transition-all duration-200"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="border-slate-300 transition-all duration-200"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Drawer */}
      <IncidentDrawer
        incident={selectedIncident}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaveNote={handleSaveNote}
      />

      <Toaster />
    </motion.div>
  )
}
