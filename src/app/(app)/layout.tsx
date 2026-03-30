"use client"

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/shared/sidebar'
import Navbar from '@/components/shared/navbar'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const { data: projects = [], isLoading: isFetchingProjects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await fetch('/api/projects')
            if (!response.ok) throw new Error('Failed to fetch projects')
            return response.json()
        },
    })

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) {
                setIsCollapsed(true)
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const hasNoProjects = projects.length === 0 && !isFetchingProjects

    useEffect(() => {
        if (hasNoProjects && !pathname.includes('/new-project')) {
            router.push('/new-project')
        }
    }, [hasNoProjects, pathname, router])

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar
                isCollapsed={isCollapsed}
                toggleSidebar={toggleSidebar}
                isMobile={isMobile}
                disabled={hasNoProjects}
            />
            <main className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                <Navbar
                    isCollapsed={isCollapsed}
                    toggleSidebar={toggleSidebar}
                    isMobile={isMobile}
                />
                <div className={cn(
                    "flex-1 overflow-auto transition-all duration-300",
                    !isMobile && (isCollapsed ? "md:pl-20" : "md:pl-64")
                )}>
                    <div className="p-4 md:p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AppLayout