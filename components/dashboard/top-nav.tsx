"use client"

import Image from "next/image"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const golfCourses = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Golf de Seignosse" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Golf de Biarritz" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Golf de Chiberta" },
]

interface TopNavProps {
  selectedCourseId: string
  onCourseChange: (courseId: string) => void
  onSimulate?: () => void
}

export function TopNav({ selectedCourseId, onCourseChange, onSimulate }: TopNavProps) {
  const selectedCourse = golfCourses.find((c) => c.id === selectedCourseId) || golfCourses[0]

  return (
    <div className="glass sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200/50 bg-white/70 backdrop-blur-md px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center justify-center">
          <div className="relative h-16 w-16 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="GreenLog OS"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="h-6 w-px bg-gray-200"></div>
        <Select value={selectedCourseId} onValueChange={onCourseChange}>
          <SelectTrigger className="w-[240px] border-gray-200 bg-white">
            <SelectValue>{selectedCourse.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {golfCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {onSimulate && (
        <Button
          size="sm"
          onClick={onSimulate}
          className="gap-2 bg-[#064e3b] text-white hover:bg-[#064e3b]/90"
        >
          <Plus className="h-4 w-4" />
          Simuler Signalement
        </Button>
      )}
    </div>
  )
}

