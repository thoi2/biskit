"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useUserStore } from "@/store/userStore"

interface AuthContextType {
  user: any  // 🔥 간단하게 any 사용
  loading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, logout } = useUserStore()

  const signOut = () => {
    logout()
  }

  return (
      <AuthContext.Provider
          value={{
            user: isLoggedIn ? { name: "사용자", email: "user@example.com" } : null,
            loading: false,
            signOut
          }}
      >
        {children}
      </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
