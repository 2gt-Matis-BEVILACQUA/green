"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Droplets, Scissors, Flag, AlertCircle, Camera } from "lucide-react"
import Image from "next/image"
import { formatTimeAgo } from "@/lib/utils"
import { IncidentCategory, Priority, IncidentStatus } from "@/lib/types"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface IncidentCardProps {
  id: string
  holeNumber: number
  category: IncidentCategory
  description?: string | null
  photoUrl?: string | null
  priority: Priority
  status: IncidentStatus
  createdAt: Date
  onResolve: (id: string) => void
}

const categoryIcons = {
  Arrosage: Droplets,
  Tonte: Scissors,
  Bunker: Flag,
  Signaletique: AlertCircle,
  Autre: AlertCircle,
}

const priorityVariants = {
  Low: "default",
  Medium: "amber",
  High: "coral",
  Critical: "coral",
} as const

export function IncidentCard({
  id,
  holeNumber,
  category,
  description,
  photoUrl,
  priority,
  status,
  createdAt,
  onResolve,
}: IncidentCardProps) {
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const Icon = categoryIcons[category] || AlertCircle

  if (status === "Resolved") return null

  return (
    <>
      <Card className="group relative overflow-hidden border border-gray-200 bg-white/80 backdrop-blur-sm transition-all hover:shadow-lg hover:border-emerald-deep/20">
        <CardContent className="p-0">
          <div className="flex">
            {/* Photo Section */}
            {photoUrl && (
              <div
                className="relative h-32 w-32 flex-shrink-0 cursor-pointer overflow-hidden bg-gray-100 transition-opacity hover:opacity-90"
                onClick={() => setIsImageOpen(true)}
              >
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Camera className="h-6 w-6 animate-pulse text-gray-400" />
                  </div>
                )}
                <Image
                  src={photoUrl}
                  alt={`Incident trou ${holeNumber}`}
                  fill
                  className={cn(
                    "object-cover transition-opacity",
                    imageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setImageLoading(false)}
                  sizes="128px"
                />
              </div>
            )}

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-deep/10 text-lg font-bold text-emerald-deep">
                    {holeNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge
                        variant={priorityVariants[priority]}
                        className="text-xs"
                      >
                        {category}
                      </Badge>
                      <Badge variant={priorityVariants[priority]} className="text-xs">
                        {priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTimeAgo(createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {description && (
                <p className="mt-2 text-sm text-foreground line-clamp-2">
                  {description}
                </p>
              )}

              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => onResolve(id)}
                  className="bg-emerald-deep hover:bg-emerald-deep/90"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marquer comme résolu
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Screen Image Dialog */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Incident - Trou {holeNumber}</DialogTitle>
            <DialogDescription>{category}</DialogDescription>
          </DialogHeader>
          {photoUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={photoUrl}
                alt={`Incident trou ${holeNumber}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

