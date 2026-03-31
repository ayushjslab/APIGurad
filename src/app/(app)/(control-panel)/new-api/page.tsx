"use client"

import { useState } from 'react'
import { Plus, Trash2, Globe, FileText, Settings, AlertCircle, Save, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { useProject } from '@/context/project-context'

type Header = {
    key: string;
    value: string;
}

const NewApiPage = () => {
    const router = useRouter()
    const { activeProject, setActiveProject, projects, isLoading: isLoadingProjects } = useProject()

    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [method, setMethod] = useState('GET')
    const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }])
    const [body, setBody] = useState('')
    const [expectedStatus, setExpectedStatus] = useState('200')
    const [expectedStructure, setExpectedStructure] = useState('')
    const [interval, setInterval] = useState('5min')
    const [isSaving, setIsSaving] = useState(false)


    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '' }])
    }

    const removeHeader = (index: number) => {
        const newHeaders = [...headers]
        newHeaders.splice(index, 1)
        setHeaders(newHeaders)
    }

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers]
        newHeaders[index][field] = value
        setHeaders(newHeaders)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Service Name is required')
            return
        }

        if (!activeProject?._id) {
            toast.error('Please select a project')
            return
        }

        if (!url) {
            toast.error('Endpoint URL is required')
            return
        }

        // Validate JSON if present
        if (body) {
            try {
                JSON.parse(body)
            } catch (e) {
                toast.error('Invalid JSON in Request Body')
                return
            }
        }

        if (expectedStructure) {
            try {
                JSON.parse(expectedStructure)
            } catch (e) {
                toast.error('Invalid JSON in Expected Response Structure')
                return
            }
        }

        setIsSaving(true)
        try {
            const response = await fetch('/api/apis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: activeProject?._id,
                    name,
                    url,
                    method,
                    headers: headers.filter(h => h.key.trim() !== ''),
                    body,
                    expectedStatus,
                    expectedResponseStructure: expectedStructure,
                    interval
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save API')
            }

            toast.success('API configuration saved successfully')
            router.push('/apis')
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Add New API</h1>
                <p className="text-muted-foreground">Configure the endpoint and your expectations for monitoring.</p>
            </div>

            <div className="grid gap-6">
                {/* Project and Name Configuration */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            General Information
                        </CardTitle>
                        <CardDescription>Associate this API with a project and give it a name.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="project">Project</Label>
                                <Select
                                    value={activeProject?._id || ""}
                                    onValueChange={(val) => {
                                        const project = projects.find(p => p._id === val)
                                        if (project) setActiveProject(project)
                                    }}
                                    disabled={isLoadingProjects}
                                >
                                    <SelectTrigger id="project" className="rounded-xl border-border/50">
                                        <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                        {projects.map((p) => (
                                            <SelectItem key={p._id} value={p._id} className="rounded-lg">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Service Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Authentication Service"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-xl border-border/50 focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="interval">Monitoring Interval</Label>
                                <Select value={interval} onValueChange={setInterval}>
                                    <SelectTrigger id="interval" className="rounded-xl border-border/50">
                                        <SelectValue placeholder="Select interval" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                        <SelectItem value="2min" className="rounded-lg">Every 2 minutes</SelectItem>
                                        <SelectItem value="5min" className="rounded-lg">Every 5 minutes</SelectItem>
                                        <SelectItem value="10min" className="rounded-lg">Every 10 minutes</SelectItem>
                                        <SelectItem value="15min" className="rounded-lg">Every 15 minutes</SelectItem>
                                        <SelectItem value="20min" className="rounded-lg">Every 20 minutes</SelectItem>
                                        <SelectItem value="25min" className="rounded-lg">Every 25 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Request Configuration */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Request Details
                        </CardTitle>
                        <CardDescription>Specify the endpoint and HTTP method.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="method">Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger id="method" className="rounded-xl border-border/50">
                                        <SelectValue placeholder="HTTP Method" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                        <SelectItem value="GET" className="rounded-lg font-medium text-blue-500">GET</SelectItem>
                                        <SelectItem value="POST" className="rounded-lg font-medium text-green-500">POST</SelectItem>
                                        <SelectItem value="PUT" className="rounded-lg font-medium text-orange-500">PUT</SelectItem>
                                        <SelectItem value="DELETE" className="rounded-lg font-medium text-red-500">DELETE</SelectItem>
                                        <SelectItem value="PATCH" className="rounded-lg font-medium text-purple-500">PATCH</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="url">Endpoint URL</Label>
                                <div className="relative">
                                    <Input
                                        id="url"
                                        placeholder="https://api.example.com/v1/users"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="pl-3 rounded-xl border-border/50 focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Headers</Label>
                                <Button variant="outline" size="sm" onClick={addHeader} className="h-8 rounded-lg border-border/50 hover:bg-primary/10 hover:text-primary transition-all">
                                    <Plus className="h-4 w-4 mr-1" /> Add Header
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {headers.map((header, index) => (
                                    <div key={index} className="flex gap-2 items-start group">
                                        <Input
                                            placeholder="Key (e.g. Authorization)"
                                            value={header.key}
                                            onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                            className="flex-1 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all font-mono text-xs"
                                        />
                                        <Input
                                            placeholder="Value"
                                            value={header.value}
                                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                            className="flex-1 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all font-mono text-xs"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeHeader(index)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 w-10 shrink-0"
                                            disabled={headers.length === 1 && !header.key && !header.value}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {['POST', 'PUT', 'PATCH'].includes(method) && (
                            <div className="space-y-2 animate-in slide-in-from-top duration-300">
                                <Label htmlFor="body">Request Body (JSON)</Label>
                                <Textarea
                                    id="body"
                                    placeholder='{"name": "test"}'
                                    className="font-mono text-xs min-h-[120px] rounded-2xl border-border/50 focus-visible:ring-primary/20 transition-all p-4"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expectations Configuration */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Expectations
                        </CardTitle>
                        <CardDescription>What defines a "healthy" response?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1 space-y-2">
                                <Label htmlFor="status">Status Code</Label>
                                <Input
                                    id="status"
                                    placeholder="200"
                                    value={expectedStatus}
                                    onChange={(e) => setExpectedStatus(e.target.value)}
                                    className="rounded-xl border-border/50 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label htmlFor="structure" className="flex items-center gap-1.5">
                                    Expected Response Structure (JSON)
                                    <Badge variant="secondary" className="font-normal text-[10px] rounded-md opacity-70">Optional</Badge>
                                </Label>
                                <Textarea
                                    id="structure"
                                    placeholder='{"id": "string", "name": "string"}'
                                    className="font-mono text-xs min-h-[120px] rounded-2xl border-border/50 focus-visible:ring-primary/20 transition-all p-4"
                                    value={expectedStructure}
                                    onChange={(e) => setExpectedStructure(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/50 bg-muted/20 flex justify-end gap-3 pt-6 pb-6 rounded-b-3xl">
                        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl transition-all h-11"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save API
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default NewApiPage