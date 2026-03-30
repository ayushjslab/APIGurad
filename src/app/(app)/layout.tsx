"use client"

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/shared/sidebar'
import Navbar from '@/components/shared/navbar'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'

import { ProjectProvider } from '@/context/project-context'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

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

    const toggleSidebar = () => setIsCollapsed(!isCollapsed)

    return (
        <ProjectProvider>
            <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
                <Sidebar
                    isCollapsed={isCollapsed}
                    toggleSidebar={toggleSidebar}
                    isMobile={isMobile}
                    disabled={false} // Will handle disabled state in Sidebar using context if needed
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
        </ProjectProvider>
    )
}

export default AppLayout