"use client"

import Button from '@/components/ui/Button/Button'
import { LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface User {
  name?: string
  email?: string
}

interface AppHeaderProps {
  user: User | null
  onLogin: () => void
}

export function AppHeader({ user, onLogin }: AppHeaderProps) {
  const { signOut } = useAuth()

  return (
    <header className="text-white p-6 shadow-lg border-b border-orange-600/20 bg-gradient-to-r from-amber-600 to-orange-600">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-orange-500/50 bg-orange-700">
            <span className="text-white font-bold text-lg">🍪</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              BISKIT
            </h1>
            <p className="text-sm font-medium tracking-wider text-orange-100">
              BUSINESS START KIT
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="text-right">
                <p className="text-sm text-orange-100">
                  안녕하세요,
                </p>
                <p className="font-semibold text-white">
                  {user.name || user.email?.split("@")[0]}님
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white hover:bg-white/20 border border-white/40 backdrop-blur-sm transition-all duration-300 font-medium bg-transparent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={onLogin}
              variant="ghost"
              className="text-white hover:bg-white/20 border border-white/40 backdrop-blur-sm"
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}