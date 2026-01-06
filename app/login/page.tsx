"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { LogIn, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        toast({
          title: "Connexion réussie",
          description: "Redirection vers le dashboard...",
        })
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#020617] px-6">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,78,59,0.05),transparent_50%)]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8 backdrop-blur-xl">
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-flex items-center justify-center">
              <Logo className="text-white" size="lg" />
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-white">Connexion</h1>
            <p className="mt-2 text-sm text-white/70">
              Accédez à votre espace de gestion
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-slate-800/50 bg-slate-900/30 text-white placeholder:text-white/40 focus:border-[#064e3b] focus:ring-[#064e3b]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-slate-800/50 bg-slate-900/30 text-white placeholder:text-white/40 focus:border-[#064e3b] focus:ring-[#064e3b]/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#064e3b] text-white hover:bg-[#064e3b]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-white/60">
            <p>
              Besoin d'un accès ?{" "}
              <Link href="/" className="text-emerald-400 hover:text-emerald-300">
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
