"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Code2, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Şifre kontrolü
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor")
      return
    }

    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalı")
      return
    }

    setIsLoading(true)

    const result = await register(
      formData.fullName,
      formData.email,
      formData.password,
      formData.confirmPassword
    )

    if (!result.success) {
      setError(result.message)
    }

    setIsLoading(false)
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-primary to-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/code-development-pattern.jpg')] opacity-10" />
        <div className="relative z-10 max-w-md space-y-6 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Code2 className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold leading-tight">Yapay Zeka Destekli Kod Analizi</h1>
          <p className="text-lg text-white/80">
            Hemen kaydolun ve kodlarınızı analiz etmeye başlayın. Unit test, açıklama ve UI test özellikleriyle
            geliştirmenizi hızlandırın.
          </p>
          <div className="flex gap-2 pt-4">
            <div className="h-2 w-2 rounded-full bg-white/40" />
            <div className="h-2 w-8 rounded-full bg-white" />
            <div className="h-2 w-2 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <Card className="w-full max-w-md border-border bg-card p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary lg:hidden">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Hesap Oluştur</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ücretsiz hesap oluşturun ve başlayın</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Ad Soyad
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-posta
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Şifre Tekrar
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  Kayıt Ol
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
            <Link href="/login" className="font-medium text-primary hover:underline">
              Giriş yapın
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}