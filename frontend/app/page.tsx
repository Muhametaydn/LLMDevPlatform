"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Code2, Sparkles, Copy, Check, AlertCircle } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7295"

export default function HomePage() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("Python")
  const [operation, setOperation] = useState("unittest")
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Lütfen analiz edilecek kod girin")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult("")

    try {
      const token = localStorage.getItem("token")

      // Analiz başlat
      const submitResponse = await fetch(`${API_URL}/api/Analysis/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          code: code,
          language: language,
          taskType: operation
        })
      })

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        throw new Error(errorData.message || errorData.error || "Analiz başlatılamadı")
      }

      const submitData = await submitResponse.json()
      const analysisId = submitData.analysisId

      // Sonucu bekle (polling)
      let attempts = 0
      const maxAttempts = 60 // 60 saniye timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 saniye bekle

        const resultResponse = await fetch(`${API_URL}/api/Analysis/${analysisId}`, {
          headers: {
            ...(token && { "Authorization": `Bearer ${token}` })
          }
        })

        if (resultResponse.ok) {
          const resultData = await resultResponse.json()

          if (resultData.status === "Completed") {
            setResult(resultData.result || "Sonuç alındı")
            break
          } else if (resultData.status === "Failed") {
            throw new Error(resultData.errorMessage || "Analiz başarısız oldu")
          }
          // Processing durumunda devam et
        }

        attempts++
      }

      if (attempts >= maxAttempts) {
        throw new Error("Analiz zaman aşımına uğradı")
      }

    } catch (err: any) {
      console.error("Analiz hatası:", err)
      setError(err.message || "Bir hata oluştu. Backend çalışıyor mu?")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLanguageDisplay = () => {
    const labels: { [key: string]: string } = {
      "Python": "PYTHON",
      "CSharp": "C#",
      "Java": "JAVA"
    }
    return labels[language] || language.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Kod Analiz Platformu</h1>
          <p className="text-lg text-muted-foreground">LLM ajanlarıyla kodunuzu analiz edin ve test oluşturun</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="border-border bg-card p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="code" className="mb-2 text-base font-semibold">
                  Kodunuzu Yapıştırın
                </Label>
                <div className="relative">
                  <textarea
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Kodunuzu buraya yapıştırın..."
                    className="min-h-[400px] w-full rounded-lg border border-input bg-muted/30 p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="absolute right-3 top-3 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {getLanguageDisplay()}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Dil Seçimi
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="CSharp">C#</SelectItem>
                      <SelectItem value="Java">Java</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operation" className="text-sm font-medium">
                    İşlem Türü
                  </Label>
                  <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger id="operation" className="bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unittest">Unit Test</SelectItem>
                      <SelectItem value="codeexplanation">Kod Açıklama</SelectItem>
                      <SelectItem value="uitest">UI Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!code || isAnalyzing}
                className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analiz Et
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Result Section */}
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <Label className="text-base font-semibold">Analiz Sonucu</Label>
              {result && (
                <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Kopyala
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="relative min-h-[400px] rounded-lg border border-input bg-muted/30 p-4 overflow-auto max-h-[500px]">
              {result ? (
                <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                  <code>{result}</code>
                </pre>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-center">
                  <div className="space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Kodunuzu analiz etmek için yukarıdaki formu doldurun
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}