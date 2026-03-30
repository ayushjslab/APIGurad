"use client"

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    HiOutlineFolder,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlinePlus,
    HiOutlineExclamation
} from 'react-icons/hi'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Project {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
}

const ManageProjectPage = () => {
    const queryClient = useQueryClient()
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [deletingProject, setDeletingProject] = useState<Project | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Fetch projects
    const { data: projects = [], isLoading } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await fetch('/api/projects')
            if (!response.ok) throw new Error('Failed to fetch projects')
            return response.json()
        }
    })

    // Edit Mutation
    const editMutation = useMutation({
        mutationFn: async (updatedProject: Partial<Project>) => {
            const response = await fetch(`/api/projects/${editingProject?._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProject)
            })
            if (!response.ok) throw new Error('Failed to update project')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            toast.success('Project updated successfully')
            setIsEditDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete project')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            toast.success('Project deleted successfully')
            setIsDeleteDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const description = formData.get('description') as string

        if (!name.trim()) {
            toast.error('Project name is required')
            return
        }

        editMutation.mutate({ name, description })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Manage Projects</h1>
                    <p className="text-muted-foreground">Monitor and organize your API monitoring environments.</p>
                </div>
                <Link href="/new-project">
                    <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                        <HiOutlinePlus size={18} />
                        New Project
                    </Button>
                </Link>
            </div>

            {projects.length === 0 ? (
                <Card className="border-dashed border-2 py-12 bg-background/50">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <HiOutlineFolder size={32} />
                        </div>
                        <div className="space-y-1 max-w-xs">
                            <h3 className="font-bold text-xl">No projects found</h3>
                            <p className="text-muted-foreground text-sm">Create your first project to start monitoring your APIs.</p>
                        </div>
                        <Link href="/new-project">
                            <Button className="rounded-xl bg-primary shadow-lg shadow-primary/20 mt-4 px-8">Get Started</Button>
                        </Link>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Card key={project._id} className="group hover:border-primary/50 transition-all shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm flex flex-col">
                            <CardHeader className="p-5 flex flex-row items-start justify-between space-y-0">
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <HiOutlineFolder size={18} />
                                        </div>
                                        <CardTitle className="text-xl">{project.name}</CardTitle>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {project.description || "No description provided."}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="px-5 pb-4 flex-1">
                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                    Created on {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-muted/20 border-t border-border/50 flex justify-between items-center gap-2 mt-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg gap-2 border-border/50 hover:bg-primary/10 hover:text-primary transition-colors h-9 flex-1"
                                    onClick={() => {
                                        setEditingProject(project)
                                        setIsEditDialogOpen(true)
                                    }}
                                >
                                    <HiOutlinePencil size={16} />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg gap-2 text-destructive border-border/50 hover:bg-destructive/10 hover:text-destructive h-9 flex-1"
                                    onClick={() => {
                                        setDeletingProject(project)
                                        setIsDeleteDialogOpen(true)
                                    }}
                                >
                                    <HiOutlineTrash size={16} />
                                    Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Make changes to your project here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Project Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={editingProject?.name}
                                    className="rounded-xl border-border/50 transition-all focus-visible:ring-primary/20 h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={editingProject?.description}
                                    placeholder="Briefly describe your project..."
                                    className="rounded-xl border-border/50 transition-all focus-visible:ring-primary/20 min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                className="rounded-xl"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-xl px-6 bg-primary shadow-lg shadow-primary/20"
                                disabled={editMutation.isPending}
                            >
                                {editMutation.isPending ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <HiOutlineExclamation className="h-5 w-5" />
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            <span className="font-bold text-foreground"> "{deletingProject?.name}" </span>
                            and all of its associated API monitors.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-6 shadow-lg shadow-destructive/20"
                            onClick={() => deletingProject && deleteMutation.mutate(deletingProject._id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default ManageProjectPage