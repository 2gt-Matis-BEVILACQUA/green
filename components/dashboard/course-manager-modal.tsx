"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Course } from "@/lib/types"
import { Plus, Trash2, Edit2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface CourseManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clubId: string
  onCourseSelected?: (courseId: string) => void
}

export function CourseManagerModal({
  open,
  onOpenChange,
  clubId,
  onCourseSelected,
}: CourseManagerModalProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({ name: "", hole_count: 18 })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchCourses()
    }
  }, [open, clubId])

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/courses?club_id=${clubId}&active_only=false`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingCourse) {
        // Update
        const response = await fetch(`/api/courses/${editingCourse.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            hole_count: parseInt(formData.hole_count.toString()),
            is_active: editingCourse.is_active,
          }),
        })

        if (!response.ok) throw new Error("Failed to update course")

        toast({
          title: "Parcours mis à jour",
          description: "Le parcours a été modifié avec succès.",
        })
      } else {
        // Create
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            club_id: clubId,
            name: formData.name,
            hole_count: parseInt(formData.hole_count.toString()),
            is_active: true,
          }),
        })

        if (!response.ok) throw new Error("Failed to create course")

        toast({
          title: "Parcours créé",
          description: "Le nouveau parcours a été ajouté avec succès.",
        })
      }

      setFormData({ name: "", hole_count: 18 })
      setEditingCourse(null)
      fetchCourses()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (courseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce parcours ?")) return

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete course")

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

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({ name: course.name, hole_count: course.hole_count })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Gérer les Parcours
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Ajoutez, modifiez ou supprimez des parcours de golf
          </DialogDescription>
        </DialogHeader>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div>
            <Label htmlFor="name" className="text-slate-900">
              Nom du parcours
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: L'Océan"
              className="mt-1 border-gray-200"
              required
            />
          </div>
          <div>
            <Label htmlFor="hole_count" className="text-slate-900">
              Nombre de trous
            </Label>
            <Input
              id="hole_count"
              type="number"
              min="1"
              max="18"
              value={formData.hole_count}
              onChange={(e) =>
                setFormData({ ...formData, hole_count: parseInt(e.target.value) || 18 })
              }
              className="mt-1 border-gray-200"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#064e3b] text-white hover:bg-[#064e3b]/90 border border-slate-200"
            >
              {editingCourse ? "Modifier" : "Créer"} le parcours
            </Button>
            {editingCourse && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingCourse(null)
                  setFormData({ name: "", hole_count: 18 })
                }}
              >
                Annuler
              </Button>
            )}
          </div>
        </form>

        {/* Liste des parcours */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Parcours existants ({courses.length})
          </h3>
          <AnimatePresence>
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white shadow-sm"
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
                    onClick={() => handleEdit(course)}
                    className="text-[#064e3b] hover:bg-[#064e3b]/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                    className="text-[#E0115F] hover:bg-[#E0115F]/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

