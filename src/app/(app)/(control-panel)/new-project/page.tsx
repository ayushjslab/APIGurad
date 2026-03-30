"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HiOutlineFolder, HiOutlinePlus, HiOutlineSparkles, HiArrowRight } from 'react-icons/hi'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const NewProjectPage = () => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const queryClient = useQueryClient()

    const handleCreateProject = async () => {
        if (!name.trim()) {
            toast.error('Project name is required')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create project')
            }

            const project = await response.json()
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            toast.success(`Project "${project.name}" created successfully!`)
            router.push('/dashboard')
            router.refresh()

        } catch (error: any) {
            console.error('Failed to create project', error)
            toast.error(error.message || 'Failed to create project')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2 items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <HiOutlineFolder size={32} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Create New Project</h1>
                <p className="text-muted-foreground text-lg transition-colors">Organize your APIs under a unified project for better monitoring.</p>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <HiOutlinePlus className="h-5 w-5 text-primary" />
                        Project Information
                    </CardTitle>
                    <CardDescription>Give your project a name and an optional description to get started.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                            Project Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g. My Stellar API"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 text-base rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Optionally describe what this project is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[120px] text-base rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all resize-none"
                        />
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 items-start animate-in slide-in-from-bottom-2 duration-700 delay-150">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                            <HiOutlineSparkles size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold">Pro-tip</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Projects help you group related APIs. You can share projects with team members and set global monitoring alerts later.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-8 py-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="rounded-xl hover:bg-muted font-medium transition-colors"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateProject}
                        disabled={isLoading}
                        className="px-8 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl transition-all group"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Create Project</span>
                                <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    Need help? <a href="#" className="underline hover:text-primary transition-colors">Check out our guide on organizing projects</a>.
                </p>
            </div>
        </div>
    )
}

export default NewProjectPage
