"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'

interface Project {
    _id: string;
    name: string;
}

interface ProjectContextType {
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
    projects: Project[];
    isLoading: boolean;
    session: any;
    plan: any;
    isPlanLoading: boolean;
}

import { usePathname, useRouter } from 'next/navigation'

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, isPending: isSessionLoading } = authClient.useSession()
    const [activeProject, setActiveProject] = useState<Project | null>(null)

    const { data: projects = [], isLoading } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await fetch('/api/projects')
            if (!response.ok) throw new Error('Failed to fetch projects')
            return response.json()
        },
        enabled: !!session,
    })

    const { data: plan, isLoading: isPlanLoading } = useQuery({
        queryKey: ['plan-usage'],
        queryFn: async () => {
            const response = await fetch('/api/plan/usage')
            if (!response.ok) throw new Error('Failed to fetch plan usage')
            return response.json()
        },
        enabled: !!session,
    })

    // Auto-select first project if none is active
    useEffect(() => {
        if (projects.length > 0 && !activeProject) {
            setActiveProject(projects[0])
        } else if (projects.length === 0) {
            setActiveProject(null)
        } else if (activeProject && projects.length > 0) {
            const current = projects.find(p => p._id === activeProject._id)
            if (current && JSON.stringify(current) !== JSON.stringify(activeProject)) {
                setActiveProject(current)
            }
        }
    }, [projects, activeProject])

    return (
        <ProjectContext.Provider value={{
            activeProject,
            setActiveProject,
            projects,
            isLoading: isLoading || isSessionLoading,
            session: session || null,
            plan: plan || null,
            isPlanLoading
        }}>
            {children}
        </ProjectContext.Provider>
    )
}

export const ProjectSyncRedirect = ({ children }: { children: React.ReactNode }) => {
    const { projects, isLoading, session } = useProject()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && session && projects.length === 0 && !pathname.includes('/new-project')) {
            router.push('/new-project')
        }
    }, [projects, isLoading, session, pathname, router])

    return <>{children}</>
}

export const useProject = () => {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider')
    }
    return context
}
