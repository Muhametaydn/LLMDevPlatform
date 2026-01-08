"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Trash2, Code2, Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7295"

interface AnalysisHistoryItem {
  id: string
  language: string
  taskType: string
  status: string
  codePreview: string
  createdAt: string
  completedAt: string | null
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLanguage, setFilterLanguage] = useState("all")
  const [filterOperation, setFilterOperation] = useState("all")
  
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchHistory()
  }, [user])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/Analysis/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      } else {
        setError("Geçmiş yüklenemedi")
      }
    } catch (err) {
      setError("Bağlantı hatası. Backend çalışıyor mu?")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu analizi silmek istediğinize emin misiniz?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/Analysis/history/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        setHistory(history.filter(item => item.id !== id))
      } else {
        alert("Silme işlemi başarısız")
      }
    } catch (err) {
      alert("Bağlantı hatası")
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

  // Filtreleme
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.codePreview.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = filterLanguage === "all" || item.language.toLowerCase() === filterLanguage
    const matchesOperation = filterOperation === "all" || item.taskType.toLowerCase() === filterOperation.replace("-", "")
    return matchesSearch && matchesLanguage && matchesOperation
  })

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Analiz Geçmişi</h1>
          <p className="text-muted-foreground">Geçmiş analizlerinizi görüntüleyin ve yönetin</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kod içeriğinde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Dil seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Diller</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterOperation} onValueChange={setFilterOperation}>
              <SelectTrigger>
                <SelectValue placeholder="İşlem türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşlemler</SelectItem>
                <SelectItem value="unittest">Unit Test</SelectItem>
                <SelectItem value="codeexplanation">Kod Açıklama</SelectItem>
                <SelectItem value="uitest">UI Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* History Cards */}
        {filteredHistory.length === 0 ? (
          <Card className="border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Code2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Henüz analiz yok</h3>
            <p className="mt-2 text-muted-foreground">
              Kod analizi yaptığınızda burada görünecek
            </p>
            <Link href="/">
              <Button className="mt-4">İlk Analizi Yap</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="border-border bg-card p-6 transition-all hover:border-primary/50">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Code2 className="h-3 w-3" />
                        {item.language}
                      </Badge>
                      <Badge variant="outline">{getTaskTypeText(item.taskType)}</Badge>
                      <Badge className={getStatusColor(item.status)}>{getStatusText(item.status)}</Badge>
                    </div>

                    <div className="font-mono text-sm text-muted-foreground">{item.codePreview}</div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/history/${item.id}`}>
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Detay
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredHistory.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Toplam <span className="font-medium text-foreground">{filteredHistory.length}</span> analiz
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </Button>
              <Button variant="outline" size="sm" disabled>
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
