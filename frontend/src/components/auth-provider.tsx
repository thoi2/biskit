"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuthStore } from "@/store/authStore"

interface User {
  userId: number;
  email: string;
  name: string;
  profileImageUrl: string;
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { isLoggedIn, logout } = useAuthStore()

  useEffect(() => {
    // 기존 zustand store 상태를 기반으로 user 설정
    if (isLoggedIn) {
      // 로그인 상태면 mock user data 설정 (실제로는 API에서 가져와야 함)
      setUser({
        userId: 1,
        email: "user@example.com",
        name: "사용자",
        profileImageUrl: ""
      })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [isLoggedIn])

  const signOut = async () => {
    logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}