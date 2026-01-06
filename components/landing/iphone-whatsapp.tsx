"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Check, Image as ImageIcon } from "lucide-react"

interface Message {
  id: number
  sender: "bot" | "user"
  text: string
  image?: boolean
  delay: number
}

const messages: Message[] = [
  { id: 1, sender: "bot", text: "Bonjour ! Sur quel parcours se situe l'incident ?", delay: 1000 },
  { id: 2, sender: "user", text: "Parcours Les Étangs", delay: 3000 },
  { id: 3, sender: "bot", text: "Reçu. Quel numéro de trou ?", delay: 5000 },
  { id: 4, sender: "user", text: "Trou n°4", delay: 7000 },
  { id: 5, sender: "bot", text: "Décrivez le problème et envoyez une photo.", delay: 9000 },
  { id: 6, sender: "user", text: "Fuite importante sur arroseur.", delay: 11000 },
  { id: 7, sender: "user", text: "", image: true, delay: 13000 },
  { id: 8, sender: "bot", text: "✅ Incident synchronisé. Il est maintenant visible sur votre Dashboard.", delay: 15000 },
]

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 backdrop-blur-sm"
    >
      <motion.div
        className="h-2 w-2 rounded-full bg-white/60"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-white/60"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-white/60"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </motion.div>
  )
}

export function IPhoneWhatsApp() {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([])
  const [showTyping, setShowTyping] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)
  const loopTimeoutRef = useRef<NodeJS.Timeout>()

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [displayedMessages, showTyping])

  const startConversation = () => {
    messages.forEach((msg) => {
      if (msg.sender === "bot" && msg.id > 1) {
        setTimeout(() => {
          setShowTyping(true)
        }, msg.delay - 500)
      }

      setTimeout(() => {
        setShowTyping(false)
        setDisplayedMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }, msg.delay)
    })

    // Loop after last message
    loopTimeoutRef.current = setTimeout(() => {
      setDisplayedMessages([])
      setShowTyping(false)
      setTimeout(() => startConversation(), 500)
    }, 17000)
  }

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    startConversation()

    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Fixed iPhone Container - Never changes size */}
      <div className="relative" style={{ aspectRatio: "9/19.5", height: "650px" }}>
        {/* iPhone Frame with Glassmorphism */}
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-2 shadow-2xl backdrop-blur-xl border border-white/20">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-3xl bg-gradient-to-br from-slate-900 to-slate-950"></div>
          
          {/* Screen - Fixed Container */}
          <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-950 to-black border border-white/10">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2 text-xs text-white/90">
              <span className="font-medium">
                {currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-white/80"></div>
                <div className="h-1 w-1 rounded-full bg-white/80"></div>
                <div className="h-1 w-1 rounded-full bg-white/60"></div>
              </div>
            </div>

            {/* WhatsApp Header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#064e3b] to-emerald-600"></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">TerrainSync</div>
                <div className="text-xs text-white/60">en ligne</div>
              </div>
            </div>

            {/* Messages Container - Scrollable */}
            <div className="h-[calc(100%-120px)] overflow-y-auto bg-gradient-to-b from-slate-950 to-black p-4">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {displayedMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender === "user"
                            ? "bg-[#064e3b] text-white"
                            : "bg-white/5 text-white border border-white/10 backdrop-blur-sm"
                        }`}
                      >
                        {msg.image ? (
                          <div className="relative w-full overflow-hidden rounded-lg">
                            <Image
                              src="/incident_photo.jpg"
                              alt="Photo incident"
                              width={192}
                              height={128}
                              className="h-auto w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = "none"
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = '<div class="flex h-32 w-full items-center justify-center bg-white/5 border border-white/10 rounded-lg"><svg class="h-8 w-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>'
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        )}
                        {msg.sender === "bot" && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-blue-400">
                            <Check className="h-3 w-3" />
                            <Check className="h-3 w-3 -ml-2" />
                            <span>Lu</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {showTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-r from-[#064e3b]/20 via-transparent to-[#064e3b]/20 blur-3xl"></div>
    </div>
  )
}
