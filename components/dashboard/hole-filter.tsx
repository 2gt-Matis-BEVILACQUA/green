"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HoleFilterProps {
  selectedHoles: number[]
  onHoleToggle: (hole: number) => void
}

export function HoleFilter({ selectedHoles, onHoleToggle }: HoleFilterProps) {
  const holes = Array.from({ length: 18 }, (_, i) => i + 1)

  return (
    <div className="flex flex-wrap gap-2">
      {holes.map((hole) => {
        const isSelected = selectedHoles.includes(hole)
        return (
          <Button
            key={hole}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onHoleToggle(hole)}
              className={cn(
                "h-10 w-10 rounded-full p-0 border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-[#000000]",
                isSelected && "bg-[#004225] text-white hover:bg-[#004225]/90 border-[#004225]"
              )}
          >
            {hole}
          </Button>
        )
      })}
    </div>
  )
}

