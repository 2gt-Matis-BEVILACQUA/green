"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#10b981",
  colorTo = "#059669",
  delay = 0,
}: BorderBeamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let startTime = Date.now() + delay

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = (currentTime - startTime) / 1000

      if (elapsed < 0) {
        animationId = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, colorFrom)
      gradient.addColorStop(1, colorTo)

      ctx.strokeStyle = gradient
      ctx.lineWidth = borderWidth
      ctx.lineCap = "round"

      const progress = (elapsed % duration) / duration
      const offset = progress * 360

      // Draw animated border
      ctx.beginPath()
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) / 2 - borderWidth / 2,
        ((anchor - 90 + offset) * Math.PI) / 180,
        ((anchor + 90 + offset) * Math.PI) / 180
      )
      ctx.stroke()

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [size, duration, anchor, borderWidth, colorFrom, colorTo, delay])

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  )
}

