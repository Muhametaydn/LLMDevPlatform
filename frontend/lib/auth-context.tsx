"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  fullName: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7295"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Sayfa yüklendiğinde kullanıcı durumunu kontrol et
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/Auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem("token")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("token")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("token", data.token)
        setUser(data.user)
        router.push("/")
        return { success: true, message: "Giriş başarılı" }
      } else {
        return { success: false, message: data.message || "Giriş başarısız" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Bağlantı hatası. Backend çalışıyor mu?" }
    }
  }

  const register = async (fullName: string, email: string, password: string, confirmPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/api/Auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullName, email, password, confirmPassword })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("token", data.token)
        setUser(data.user)
        router.push("/")
        return { success: true, message: "Kayıt başarılı" }
      } else {
        return { success: false, message: data.message || "Kayıt başarısız" }
      }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, message: "Bağlantı hatası. Backend çalışıyor mu?" }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_URL}/api/Auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("token")
      setUser(null)
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
