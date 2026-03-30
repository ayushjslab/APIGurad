import React, { useState, useEffect } from 'react'
import {
    HiMenuAlt2,
    HiOutlineBell,
    HiOutlineChevronDown,
    HiOutlineExternalLink,
    HiOutlinePlus
} from 'react-icons/hi'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

interface NavbarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobile: boolean;
}

interface Project {
    _id: string;
    name: string;
}

import { useProject } from '@/context/project-context'

const Navbar = ({ isCollapsed, toggleSidebar, isMobile }: NavbarProps) => {
    const { data: session } = authClient.useSession()
    const { activeProject, setActiveProject, projects } = useProject()

    return (
        <header
            className={cn(
                "sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/50 transition-all duration-300",
                !isMobile && (isCollapsed ? "md:pl-20" : "md:pl-64")
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-4">
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="md:hidden rounded-xl hover:bg-primary/10 transition-colors"
                        >
                            <HiMenuAlt2 size={24} />
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 hover:bg-muted/50 transition-all h-auto">
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Project</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold truncate max-w-[120px]">
                                            {activeProject?.name || "Select Project"}
                                        </span>
                                        <HiOutlineChevronDown size={14} className="text-muted-foreground" />
                                    </div>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[220px] p-2 rounded-xl shadow-xl">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Project</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {projects.length === 0 ? (
                                <div className="p-2 text-center">
                                    <p className="text-xs text-muted-foreground py-2">No projects found</p>
                                    <Link href="/new-project">
                                        <Button variant="outline" size="sm" className="w-full text-[10px] h-8 gap-1 rounded-lg font-bold">
                                            <HiOutlinePlus size={12} /> Create First Project
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                projects.map((project) => (
                                    <DropdownMenuItem
                                        key={project._id}
                                        onClick={() => setActiveProject(project)}
                                        className="rounded-lg gap-2 cursor-pointer py-2"
                                    >
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            activeProject?._id === project._id ? "bg-primary" : "bg-muted-foreground/30"
                                        )}></div>
                                        {project.name}
                                    </DropdownMenuItem>
                                ))
                            )}

                            <DropdownMenuSeparator />
                            <Link href="/new-project">
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-primary">
                                    <HiOutlinePlus size={16} />
                                    New Project
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/manage-project">
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                                    <HiOutlineExternalLink size={16} />
                                    Manage Projects
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors relative">
                            <HiOutlineBell size={22} className="text-muted-foreground hover:text-primary transition-colors" />
                            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></div>
                        </Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all overflow-hidden border border-border/50">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {session?.user?.name?.slice(0, 2).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[240px] p-2 rounded-2xl shadow-2xl border-border/50">
                            <div className="flex items-center gap-3 p-3">
                                <Avatar className="h-10 w-10 border border-primary/20">
                                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name} />
                                    <AvatarFallback>{session?.user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{session?.user?.name}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{session?.user?.email}</span>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="opacity-50" />
                            <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">My Profile</span>
                                    <span className="text-[10px] text-muted-foreground">Account settings and more</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5">
                                <Link href="/settings">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium">Billing</span>
                                        <span className="text-[10px] text-muted-foreground">Manage your subscription</span>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-50" />
                            <DropdownMenuItem
                                onClick={() => authClient.signOut({
                                    fetchOptions: {
                                        onSuccess: () => {
                                            location.href = "/signin"
                                        }
                                    }
                                })}
                                className="rounded-xl cursor-pointer py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

export default Navbar
