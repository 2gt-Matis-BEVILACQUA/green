"use client"

import { useState, useEffect } from "react"
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Map, Building2, MessageSquare, Copy, Check, Plus, Home, Phone, Key, Loader2 } from "lucide-react"
import { Course, Club } from "@/lib/types"
import { motion } from "framer-motion"
import Image from "next/image"

const clubId = "00000000-0000-0000-0000-000000000001"

export default function SettingsPage() {
  const [club, setClub] = useState<Club | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [copied, setCopied] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const { toast } = useToast()

  const [clubForm, setClubForm] = useState({
    nom: "",
    adresse: "",
    whatsapp_number: "",
    api_key: "",
  })

  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [courseForm, setCourseForm] = useState({ name: "", hole_count: 18 })
  const [courseStats, setCourseStats] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchStats = async () => {
      const stats: Record<string, number> = {}
      for (const course of courses) {
        try {
          const response = await fetch(`/api/courses/${course.id}/stats`)
          if (response.ok) {
            const data = await response.json()
            stats[course.id] = data.count || 0
          }
        } catch (error) {
          stats[course.id] = 0
        }
      }
      setCourseStats(stats)
    }
    if (courses.length > 0) {
      fetchStats()
    }
  }, [courses])

  useEffect(() => {
    fetchClub()
    fetchCourses()
    
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab) setActiveTab(tab)
  }, [])

  const fetchClub = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clubs?id=${clubId}`)
      if (!response.ok) throw new Error("Erreur de chargement")
      const data = await response.json()
      setClub(data)
      setClubForm({
        nom: data.nom || "",
        adresse: data.adresse || "",
        whatsapp_number: data.whatsapp_number || "",
        api_key: data.api_key || "",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres du club.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleSaveClub = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/clubs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clubId,
          ...clubForm,
        }),
      })

      if (!response.ok) throw new Error("Erreur de sauvegarde")

      toast({
        title: "Paramètres sauvegardés",
        description: "Les modifications ont été enregistrées avec succès.",
      })

      fetchClub()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingCourse) {
        const response = await fetch(`/api/courses/${editingCourse.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: courseForm.name,
            hole_count: parseInt(courseForm.hole_count.toString()),
            is_active: editingCourse.is_active,
          }),
        })
        if (!response.ok) throw new Error("Erreur de mise à jour")
        toast({
          title: "Parcours mis à jour",
          description: "Le parcours a été modifié avec succès.",
        })
      } else {
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            club_id: clubId,
            name: courseForm.name,
            hole_count: parseInt(courseForm.hole_count.toString()),
            is_active: true,
          }),
        })
        if (!response.ok) throw new Error("Erreur de création")
        toast({
          title: "Parcours créé",
          description: "Le nouveau parcours a été ajouté avec succès.",
        })
      }

      setCourseForm({ name: "", hole_count: 18 })
      setEditingCourse(null)
      fetchCourses()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce parcours ?")) return

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erreur de suppression")

      toast({
        title: "Parcours supprimé",
        description: "Le parcours a été supprimé avec succès.",
      })

      fetchCourses()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le parcours.",
        variant: "destructive",
      })
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({ name: course.name, hole_count: course.hole_count })
  }

  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/webhook/whatsapp`
    : ""

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast({
      title: "URL copiée",
      description: "L'URL du webhook a été copiée dans le presse-papiers.",
    })
    setTimeout(() => setCopied(false), 2000)
  }


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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
              <p className="mt-2 text-sm text-slate-500">
                Gérez les paramètres de votre club et de vos parcours
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="courses">Gestion des Parcours</TabsTrigger>
                <TabsTrigger value="whatsapp">Notifications WhatsApp</TabsTrigger>
              </TabsList>

              {/* Profil */}
              <TabsContent value="profile" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Building2 className="h-5 w-5" />
                        Informations du Club
                      </CardTitle>
                      <CardDescription className="text-slate-500">
                        Modifiez les informations de base de votre club
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {loading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="nom" className="text-slate-900 font-medium">
                              Nom du Golf
                            </Label>
                            <div className="relative mt-2">
                              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                id="nom"
                                value={clubForm.nom}
                                onChange={(e) => setClubForm({ ...clubForm, nom: e.target.value })}
                                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Golf de Biarritz"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="adresse" className="text-slate-900 font-medium">
                              Adresse
                            </Label>
                            <div className="relative mt-2">
                              <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                id="adresse"
                                value={clubForm.adresse}
                                onChange={(e) => setClubForm({ ...clubForm, adresse: e.target.value })}
                                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: 123 Avenue du Golf, 64200 Biarritz"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleSaveClub}
                            disabled={saving}
                            className="bg-[#064e3b] text-white hover:bg-[#064e3b]/90 transition-all duration-200 disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enregistrement...
                              </>
                            ) : (
                              "Enregistrer les modifications"
                            )}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Gestion des Parcours */}
              <TabsContent value="courses" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                {/* Bouton Ajouter */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Parcours</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Gérez vos parcours de golf
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingCourse(null)
                      setCourseForm({ name: "", hole_count: 18 })
                    }}
                    className="bg-[#064e3b] text-white hover:bg-[#064e3b]/90 transition-all duration-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un nouveau parcours
                  </Button>
                </div>

                {/* Formulaire */}
                {(editingCourse || courseForm.name) && (
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-slate-900">
                        {editingCourse ? "Modifier le parcours" : "Nouveau parcours"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSaveCourse} className="space-y-4">
                        <div>
                          <Label htmlFor="course-name" className="text-slate-900 font-medium">
                            Nom du parcours
                          </Label>
                          <div className="relative mt-2">
                            <Map className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                              id="course-name"
                              value={courseForm.name}
                              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                              placeholder="Ex: L'Océan"
                              className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="course-holes" className="text-slate-900 font-medium">
                            Nombre de trous
                          </Label>
                          <Input
                            id="course-holes"
                            type="number"
                            min="1"
                            max="18"
                            value={courseForm.hole_count}
                            onChange={(e) =>
                              setCourseForm({ ...courseForm, hole_count: parseInt(e.target.value) || 18 })
                            }
                            className="mt-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={saving}
                            className="bg-[#064e3b] text-white hover:bg-[#064e3b]/90 transition-all duration-200 disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editingCourse ? "Modification..." : "Création..."}
                              </>
                            ) : (
                              `${editingCourse ? "Modifier" : "Créer"} le parcours`
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingCourse(null)
                              setCourseForm({ name: "", hole_count: 18 })
                            }}
                            className="border-slate-300 transition-all duration-200"
                          >
                            Annuler
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Grille de cartes */}
                {courses.length === 0 ? (
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-12 text-center">
                      <Map className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-sm font-medium text-slate-900">Aucun parcours configuré</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Créez votre premier parcours pour commencer
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-xl"
                      >
                        {/* Photo de couverture */}
                        <div className="relative h-48 w-full bg-gradient-to-br from-emerald-50 to-slate-100">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Map className="h-16 w-16 text-slate-300" />
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="p-6">
                          <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-900">{course.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {course.hole_count} trous • {course.is_active ? "Actif" : "Inactif"}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="mb-4 rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Incidents ce mois-ci</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {courseStats[course.id] ?? "-"}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                              className="flex-1 border-slate-300 transition-all duration-200"
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200"
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                </motion.div>
              </TabsContent>

              {/* Notifications WhatsApp */}
              <TabsContent value="whatsapp" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <MessageSquare className="h-5 w-5" />
                      Configuration WhatsApp
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                      Configurez l&apos;intégration avec votre chatbot WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="whatsapp-number" className="text-slate-900 font-medium">
                        Numéro de téléphone WhatsApp
                      </Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="whatsapp-number"
                          value={clubForm.whatsapp_number}
                          onChange={(e) => setClubForm({ ...clubForm, whatsapp_number: e.target.value })}
                          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          placeholder="+33612345678"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Numéro de téléphone lié au chatbot WhatsApp
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="api-key" className="text-slate-900 font-medium">
                        API Key
                      </Label>
                      <div className="relative mt-2">
                        <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="api-key"
                          type="password"
                          value={clubForm.api_key}
                          onChange={(e) => setClubForm({ ...clubForm, api_key: e.target.value })}
                          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          placeholder="Votre clé API"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Clé API pour l&apos;authentification du webhook
                      </p>
                    </div>

                    <div>
                      <Label className="text-slate-900 font-medium">URL du Webhook</Label>
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={webhookUrl}
                          readOnly
                          className="border-slate-300 bg-slate-50"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={copyWebhookUrl}
                          className="border-slate-300 transition-all duration-200"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Configurez cette URL dans votre service WhatsApp (Twilio, etc.)
                      </p>
                    </div>

                    {/* Switches pour notifications */}
                    <div className="space-y-4 border-t border-slate-200 pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-slate-900 font-medium">Notifications WhatsApp</Label>
                          <p className="text-xs text-slate-500">
                            Recevez des notifications en temps réel
                          </p>
                        </div>
                        <Switch
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-slate-900 font-medium">Notifications Email</Label>
                          <p className="text-xs text-slate-500">
                            Recevez un résumé quotidien par email
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveClub}
                      disabled={saving}
                      className="bg-[#064e3b] text-white hover:bg-[#064e3b]/90 transition-all duration-200 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        "Enregistrer la configuration"
                      )}
                    </Button>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </motion.div>
  )
}
