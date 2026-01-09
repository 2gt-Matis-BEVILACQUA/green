"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Course, IncidentCategory, Priority } from "@/lib/types"

interface DevModeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: Course[]
  onSuccess: () => void
}

export function DevModeModal({ open, onOpenChange, courses, onSuccess }: DevModeModalProps) {
  const [courseId, setCourseId] = useState<string>("")
  const [holeNumber, setHoleNumber] = useState<string>("")
  const [category, setCategory] = useState<IncidentCategory>("Autre")
  const [description, setDescription] = useState<string>("")
  const [priority, setPriority] = useState<Priority>("Medium")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const selectedCourse = courses.find((c) => c.id === courseId)
  const maxHoles = selectedCourse?.hole_count || 18

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!courseId || !holeNumber || !description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("course_id", courseId)
      formData.append("hole_number", holeNumber)
      formData.append("category", category)
      formData.append("description", description)
      formData.append("priority", priority)
      if (imageFile) {
        formData.append("image", imageFile)
      }

      const response = await fetch("/api/dev/inject-incident", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'injection")
      }

      const incident = await response.json()

      toast({
        title: "Incident injecté",
        description: `L'incident a été créé avec succès et apparaîtra sur le Dashboard.`,
      })

      // Réinitialiser le formulaire
      setCourseId("")
      setHoleNumber("")
      setCategory("Autre")
      setDescription("")
      setPriority("Medium")
      setImageFile(null)
      setImagePreview(null)
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'injection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Mode Dev - Injection d&apos;incident</DialogTitle>
          <DialogDescription>
            Simulez la réception d&apos;un message WhatsApp. L&apos;incident sera créé en BDD et apparaîtra instantanément sur le Dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Parcours *</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un parcours" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label htmlFor="hole">Trou *</Label>
              <Input
                id="hole"
                type="number"
                min="1"
                max={maxHoles}
                value={holeNumber}
                onChange={(e) => setHoleNumber(e.target.value)}
                placeholder={`1-${maxHoles}`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as IncidentCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arrosage">Arrosage</SelectItem>
                  <SelectItem value="Tonte">Tonte</SelectItem>
                  <SelectItem value="Bunker">Bunker</SelectItem>
                  <SelectItem value="Signaletique">Signalétique</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Basse</SelectItem>
                  <SelectItem value="Medium">Moyenne</SelectItem>
                  <SelectItem value="High">Haute</SelectItem>
                  <SelectItem value="Critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Fuite secteur 4"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Photo (optionnel)</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {imageFile ? "Changer l'image" : "Choisir une image"}
              </Button>
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Injection...
                </>
              ) : (
                "Injecter l'incident"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}