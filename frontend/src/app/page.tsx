"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Sidebar } from "@/components/layout/Sidebar"
import { MapArea } from "@/components/layout/MapArea"
import { LoadingScreen } from "@/components/ui/LoadingScreen"
import { useBiskitData } from "@/hooks/useBiskitData"

export default function HomePage() {
    const { user, loading } = useAuth()
    const [activeTab, setActiveTab] = useState("search")
    const [activeProfileTab, setActiveProfileTab] = useState("favorites")
    const [searchActive, setSearchActive] = useState(false)

    const {
        selectedCategories,
        setSelectedCategories,
        filteredBusinesses,
        recommendationResults,
        handlers
    } = useBiskitData(user, setActiveTab)

    if (loading) return <LoadingScreen />

    return (
        <div className="min-h-screen bg-gradient-warm">
            <div className="flex h-[calc(100vh-88px)]">
                <Sidebar
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    activeProfileTab={activeProfileTab}
                    setActiveProfileTab={setActiveProfileTab}
                    selectedCategories={selectedCategories}
                    filteredBusinesses={filteredBusinesses}
                    recommendationResults={recommendationResults}
                    handlers={handlers}
                />

                <MapArea
                    businesses={filteredBusinesses}
                    searchActive={searchActive}
                    setSearchActive={setSearchActive}
                    onBusinessClick={handlers.handleBusinessClick}
                    onMapClick={handlers.handleMapClick}
                />
            </div>
        </div>
    )
}
