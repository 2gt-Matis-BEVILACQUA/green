"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

export function MouseGradient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 500, damping: 100 })
  const springY = useSpring(mouseY, { stiffness: 500, damping: 100 })

  const left = useTransform(springX, (value) => `${value}px`)
  const top = useTransform(springY, (value) => `${value}px`)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left - 300) // 300 = half of gradient size
      mouseY.set(e.clientY - rect.top - 300)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute h-[600px] w-[600px] rounded-full bg-[#064e3b] opacity-[0.05] blur-3xl"
        style={{
          left,
          top,
        }}
      />
    </div>
  )
}
