"use client"

import { useState, useEffect } from "react"
import { PremiumSidebar } from "@/components/dashboard/premium-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Map, Building2, MessageSquare, Upload, Copy, Check } from "lucide-react"
import { Course, Club } from "@/lib/types"
import { motion } from "framer-motion"

const clubId = "00000000-0000-0000-0000-000000000001"

export default function SettingsPage() {
  const [club, setClub] = useState<Club | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const [clubForm, setClubForm] = useState({
    nom: "",
    adresse: "",
    whatsapp_number: "",
    api_key: "",
  })

  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [courseForm, setCourseForm] = useState({ name: "", hole_count: 18 })

  useEffect(() => {
    fetchClub()
    fetchCourses()
    
    // Restaurer l'onglet actif depuis l'URL
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
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      <PremiumSidebar />
      <div className="lg:ml-64 flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-[#064e3b]">Paramètres</h1>
              <p className="mt-1 text-sm text-slate-600">
                Gérez les paramètres de votre club et de vos parcours
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profil du Club</TabsTrigger>
                <TabsTrigger value="courses">Gestion des Parcours</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              </TabsList>

              {/* Profil du Club */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="border border-slate-200 bg-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                      <Building2 className="h-5 w-5" />
                      Informations du Club
                    </CardTitle>
                    <CardDescription className="text-[#475569]">
                      Modifiez les informations de base de votre club
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="nom" className="text-[#0F172A]">
                            Nom du Golf
                          </Label>
                          <Input
                            id="nom"
                            value={clubForm.nom}
                            onChange={(e) => setClubForm({ ...clubForm, nom: e.target.value })}
                            className="mt-1 border-[#E2E8F0]"
                            placeholder="Ex: Golf de Biarritz"
                          />
                        </div>
                        <div>
                          <Label htmlFor="adresse" className="text-[#0F172A]">
                            Adresse
                          </Label>
                          <Input
                            id="adresse"
                            value={clubForm.adresse}
                            onChange={(e) => setClubForm({ ...clubForm, adresse: e.target.value })}
                            className="mt-1 border-[#E2E8F0]"
                            placeholder="Ex: 123 Avenue du Golf, 64200 Biarritz"
                          />
                        </div>
                        <div>
                          <Label htmlFor="logo" className="text-[#0F172A]">
                            Logo (URL)
                          </Label>
                          <Input
                            id="logo"
                            value={club?.logo || ""}
                            onChange={(e) => {
                              // TODO: Implémenter upload de fichier
                            }}
                            className="mt-1 border-[#E2E8F0]"
                            placeholder="https://..."
                            disabled
                          />
                          <p className="mt-1 text-xs text-[#475569]">
                            L&apos;upload de fichier sera disponible prochainement
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="timezone" className="text-[#0F172A]">
                            Fuseau horaire
                          </Label>
                          <Input
                            id="timezone"
                            defaultValue="Europe/Paris"
                            className="mt-1 border-[#E2E8F0]"
                            disabled
                          />
                          <p className="mt-1 text-xs text-[#475569]">
                            Configuration du fuseau horaire à venir
                          </p>
                        </div>
                        <Button
                          onClick={handleSaveClub}
                          disabled={saving}
                          className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-700 border border-emerald-900/20 shadow-md"
                        >
                          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gestion des Parcours */}
              <TabsContent value="courses" className="space-y-6">
                <Card className="border border-slate-200 bg-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                      <Map className="h-5 w-5" />
                      Gestion des Parcours
                    </CardTitle>
                    <CardDescription className="text-[#475569]">
                      Ajoutez, modifiez ou supprimez des parcours de golf
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Formulaire */}
                    <form onSubmit={handleSaveCourse} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div>
                        <Label htmlFor="course-name" className="text-[#0F172A]">
                          Nom du parcours
                        </Label>
                        <Input
                          id="course-name"
                          value={courseForm.name}
                          onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                          placeholder="Ex: L'Océan"
                          className="mt-1 border-[#E2E8F0]"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="course-holes" className="text-[#0F172A]">
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
                          className="mt-1 border-[#E2E8F0]"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-700 border border-emerald-900/20 shadow-md"
                        >
                          {editingCourse ? "Modifier" : "Créer"} le parcours
                        </Button>
                        {editingCourse && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingCourse(null)
                              setCourseForm({ name: "", hole_count: 18 })
                            }}
                            className="border-[#E2E8F0]"
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </form>

                    {/* Liste des parcours */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        Parcours existants ({courses.length})
                      </h3>
                      {courses.length === 0 ? (
                        <p className="text-sm text-[#475569]">Aucun parcours configuré</p>
                      ) : (
                        <div className="space-y-2">
                          {courses.map((course) => (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white/70 p-4"
                            >
                              <div>
                                <div className="font-medium text-[#0F172A]">{course.name}</div>
                                <div className="text-sm text-[#475569]">
                                  {course.hole_count} trous • {course.is_active ? "Actif" : "Inactif"}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCourse(course)}
                                  className="text-[#064e3b] hover:bg-[#064e3b]/10"
                                >
                                  Modifier
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="text-[#E0115F] hover:bg-[#E0115F]/10"
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuration WhatsApp */}
              <TabsContent value="whatsapp" className="space-y-6">
                <Card className="border border-slate-200 bg-white shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                      <MessageSquare className="h-5 w-5" />
                      Configuration WhatsApp
                    </CardTitle>
                    <CardDescription className="text-[#475569]">
                      Configurez l&apos;intégration avec votre chatbot WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="whatsapp-number" className="text-[#0F172A]">
                        Numéro de téléphone WhatsApp
                      </Label>
                      <Input
                        id="whatsapp-number"
                        value={clubForm.whatsapp_number}
                        onChange={(e) => setClubForm({ ...clubForm, whatsapp_number: e.target.value })}
                        className="mt-1 border-[#E2E8F0]"
                        placeholder="+33612345678"
                      />
                      <p className="mt-1 text-xs text-[#475569]">
                        Numéro de téléphone lié au chatbot WhatsApp
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="api-key" className="text-[#0F172A]">
                        API Key
                      </Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={clubForm.api_key}
                        onChange={(e) => setClubForm({ ...clubForm, api_key: e.target.value })}
                        className="mt-1 border-[#E2E8F0]"
                        placeholder="Votre clé API"
                      />
                      <p className="mt-1 text-xs text-[#475569]">
                        Clé API pour l&apos;authentification du webhook
                      </p>
                    </div>

                    <div>
                      <Label className="text-[#0F172A]">URL du Webhook</Label>
                      <div className="mt-1 flex gap-2">
                        <Input
                          value={webhookUrl}
                          readOnly
                          className="border-[#E2E8F0] bg-[#F9FAFB]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={copyWebhookUrl}
                          className="border-[#E2E8F0]"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-[#475569]">
                        Configurez cette URL dans votre service WhatsApp (Twilio, etc.)
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveClub}
                      disabled={saving}
                      className="bg-[#064e3b] text-white hover:bg-[#064e3b]/90"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer la configuration"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
