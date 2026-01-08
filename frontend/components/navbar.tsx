"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Code2, History, LogOut, LogIn, User } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">CodeAnalyzer</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/">
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Code2 className="h-4 w-4" />
                Analiz
              </Button>
            </Link>
            {user && (
              <Link href="/history">
                <Button
                  variant={isActive("/history") ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  Geçmiş
                </Button>
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : user ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.fullName}</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Çıkış</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Giriş</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary">
                    Kayıt Ol
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
