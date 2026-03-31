"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HiMenuAlt2,
    HiChevronLeft,
    HiOutlineChartBar,
    HiOutlinePlusCircle,
    HiOutlineCog,
    HiOutlineFolder,
    HiOutlineCollection,
    HiOutlineDocumentText,
    HiOutlineBell
} from 'react-icons/hi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LuLayoutDashboard } from "react-icons/lu";
import { ProjectSyncRedirect, useProject } from '@/context/project-context'
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import { LuFolderCog } from "react-icons/lu";
import { LuFolderPlus } from "react-icons/lu";
interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobile: boolean;
    disabled?: boolean;
}

const Sidebar = ({ isCollapsed, toggleSidebar, isMobile }: SidebarProps) => {
    const pathname = usePathname()
    const { projects, plan, isPlanLoading } = useProject()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LuLayoutDashboard },
        { name: 'New Project', href: '/new-project', icon: LuFolderPlus },
        { name: 'APIs', href: '/apis', icon: HiOutlineCollection },
        { name: 'New API', href: '/new-api', icon: HiOutlinePlusCircle },
        { name: 'Manage Project', href: '/manage-project', icon: LuFolderCog },
        { name: 'Logs', href: '/logs', icon: HiOutlineDocumentText },
        { name: 'Statistics', href: '/stats', icon: TbBrandGoogleAnalytics },
        { name: 'Settings', href: '/settings', icon: HiOutlineCog },
    ]

    if (!mounted) return null

    const isDisabled = projects.length === 0

    return (
        <ProjectSyncRedirect>
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out",
                    "bg-card/80 backdrop-blur-md border-r border-border/50 shadow-2xl",
                    isCollapsed ? "w-20" : "w-64",
                    isMobile && isCollapsed ? "-translate-x-full" : "translate-x-0"
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 mb-6">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left duration-500">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                                A
                            </div>
                            <span className="font-bold text-xl tracking-tight hidden md:block">API Monitor</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className={cn(
                            "rounded-xl hover:bg-primary/10 hover:text-primary transition-colors",
                            isCollapsed && "mx-auto"
                        )}
                    >
                        {isCollapsed ? <HiMenuAlt2 size={24} /> : <HiChevronLeft size={24} />}
                    </Button>
                </div>

                {/* Navigation items */}
                <nav className={cn("px-3 space-y-2", isDisabled && "opacity-50 pointer-events-none")}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                                    isCollapsed ? "justify-center" : "justify-start"
                                )}
                            >
                                <Icon size={24} className={cn("shrink-0", !isActive && "group-hover:scale-110 transition-transform")} />
                                {!isCollapsed && (
                                    <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                                        {item.name}
                                    </span>
                                )}
                                {isCollapsed && (
                                    <div className="absolute left-16 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border shadow-sm">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar Footer - Usage & Limits */}
                <div className="absolute bottom-4 left-0 w-full px-3">
                    <div className={cn(
                        "p-4 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 shadow-inner",
                        isCollapsed ? "hidden" : "block animate-in fade-in slide-in-from-bottom duration-500"
                    )}>
                        {!isPlanLoading && plan ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        {plan.plan} Plan
                                    </span>
                                    <Badge variant="outline" className="h-4 text-[8px] border-primary/20 bg-primary/5 text-primary px-1">
                                        {Math.round(((plan.usedChecks || 0) / (plan.totalChecks || 1)) * 100)}% Used
                                    </Badge>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-muted-foreground">Monthly Checks</span>
                                        <span>{plan.usedChecks} / {plan.totalChecks}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                                            style={{ width: `${Math.min(100, ((plan.usedChecks || 0) / (plan.totalChecks || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-primary/5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-muted-foreground font-bold uppercase">Monitors</span>
                                        <span className="text-xs font-bold text-foreground">{plan.currentApis} / {plan.apiCredits}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-muted-foreground font-bold uppercase">Projects</span>
                                        <span className="text-xs font-bold text-foreground">{plan.currentProjects} / {plan.projectCredits}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-muted"></div>
                                <div className="flex flex-col gap-2">
                                    <div className="h-2 w-20 bg-muted rounded"></div>
                                    <div className="h-2 w-12 bg-muted rounded"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </ProjectSyncRedirect>
    )
}

export default Sidebar