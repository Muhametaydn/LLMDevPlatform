"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, Check, Calendar, Code2, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7295"

interface AnalysisDetail {
  id: string
  code: string
  language: string
  taskType: string
  status: string
  result: string | null
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export default function HistoryDetailPage() {
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedResult, setCopiedResult] = useState(false)

  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchAnalysisDetail()
  }, [user, params.id])

  const fetchAnalysisDetail = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/Analysis/history/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else if (response.status === 404) {
        setError("Analiz bulunamadı")
      } else {
        setError("Analiz yüklenemedi")
      }
    } catch (err) {
      setError("Bağlantı hatası. Backend çalışıyor mu?")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, type: "code" | "result") => {
    navigator.clipboard.writeText(text)
    if (type === "code") {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else {
      setCopiedResult(true)
      setTimeout(() => setCopiedResult(false), 2000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "tamamlandı":
        return "bg-green-500/10 text-green-500"
      case "failed":
      case "başarısız":
        return "bg-red-500/10 text-red-500"
      case "processing":
      case "işleniyor":
        return "bg-yellow-500/10 text-yellow-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "Tamamlandı"
      case "failed": return "Başarısız"
      case "processing": return "İşleniyor"
      case "pending": return "Bekliyor"
      default: return status
    }
  }

  const getTaskTypeText = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case "unittest": return "Unit Test"
      case "codeexplanation": return "Kod Açıklama"
      case "uitest": return "UI Test"
      default: return taskType
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          <Card className="border-border bg-card p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">{error || "Bir hata oluştu"}</h3>
            <Button className="mt-4" onClick={() => router.push("/history")}>
              Geçmişe Dön
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>

        {/* Header Info */}
        <Card className="mb-6 border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">Analiz Detayı</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Code2 className="h-3 w-3" />
                  {analysis.language}
                </Badge>
                <Badge variant="outline">{getTaskTypeText(analysis.taskType)}</Badge>
                <Badge className={getStatusColor(analysis.status)}>{getStatusText(analysis.status)}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(analysis.createdAt)}
                {analysis.completedAt && (
                  <span className="ml-2">
                    • Tamamlandı: {formatDate(analysis.completedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Original Code */}
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gönderilen Kod</h2>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(analysis.code, "code")} className="gap-2">
                {copiedCode ? (
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
            </div>
            <div className="rounded-lg border border-input bg-muted/30 p-4 max-h-[500px] overflow-auto">
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                <code>{analysis.code}</code>
              </pre>
            </div>
          </Card>

          {/* Analysis Result */}
          <Card className="border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Analiz Sonucu</h2>
              {analysis.result && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(analysis.result!, "result")}
                  className="gap-2"
                >
                  {copiedResult ? (
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
            <div className="rounded-lg border border-input bg-muted/30 p-4 max-h-[500px] overflow-auto">
              {analysis.result ? (
                <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                  <code>{analysis.result}</code>
                </pre>
              ) : analysis.errorMessage ? (
                <div className="text-destructive">
                  <p className="font-semibold mb-2">Hata:</p>
                  <p>{analysis.errorMessage}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Sonuç bekleniyor...</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
