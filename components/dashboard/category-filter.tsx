"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Droplets, Scissors, Flag, AlertCircle } from "lucide-react"
import { IncidentCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  selectedCategories: IncidentCategory[]
  onCategoryToggle: (category: IncidentCategory) => void
}

const categories: Array<{
  value: IncidentCategory
  label: string
  icon: typeof Droplets
}> = [
  { value: "Arrosage", label: "Arrosage", icon: Droplets },
  { value: "Tonte", label: "Tonte", icon: Scissors },
  { value: "Bunker", label: "Bunker", icon: Flag },
  { value: "Signaletique", label: "Signalétique", icon: AlertCircle },
  { value: "Autre", label: "Autre", icon: AlertCircle },
]

export function CategoryFilter({
  selectedCategories,
  onCategoryToggle,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(({ value, label, icon: Icon }) => {
        const isSelected = selectedCategories.includes(value)
        return (
          <Button
            key={value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryToggle(value)}
            className={cn(
              "gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-[#000000]",
              isSelected && "bg-[#064e3b] text-white hover:bg-[#064e3b]/90 border-[#064e3b]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        )
      })}
    </div>
  )
}

