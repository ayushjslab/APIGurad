"use client"

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProject } from '@/context/project-context'
import {
  Plus,
  Search,
  Globe,
  Activity,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface API {
  _id: string;
  projectId: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  expectedStatus: number;
  expectedResponseStructure: any;
  status: 'healthy' | 'down' | 'pending';
  lastChecked?: string;
}

const ApisPage = () => {
  const { activeProject } = useProject()
  const queryClient = useQueryClient()
  const [editingApi, setEditingApi] = React.useState<API | null>(null)

  const { data: apis = [], isLoading } = useQuery<API[]>({
    queryKey: ['apis', activeProject?._id],
    queryFn: async () => {
      if (!activeProject?._id) return []
      const response = await fetch(`/api/apis?projectId=${activeProject._id}`)
      if (!response.ok) throw new Error('Failed to fetch APIs')
      return response.json()
    },
    enabled: !!activeProject?._id
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/apis/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete API')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis', activeProject?._id] })
      toast.success('API monitor removed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(`/api/apis/${editingApi?._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update API')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apis', activeProject?._id] })
      toast.success('API monitor updated')
      setEditingApi(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update')
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'down': return 'bg-red-500/10 text-red-500 border-red-500/20'
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-3 w-3" />
      case 'down': return <AlertCircle className="h-3 w-3" />
      default: return <RefreshCw className="h-3 w-3 animate-spin" />
    }
  }

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          <Activity className="h-8 w-8" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Select a Project</h2>
          <p className="text-muted-foreground max-w-xs">Please select a project from the navbar to see your API monitors.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">API Monitors</h1>
          <p className="text-muted-foreground">
            Managing {apis.length} endpoint{apis.length !== 1 ? 's' : ''} for <span className="text-foreground font-medium">{activeProject.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/new-api">
            <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2">
              <Plus className="h-4 w-4" /> Add Monitor
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold">{apis.filter(a => a.status === 'healthy').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Down</p>
                <p className="text-2xl font-bold">{apis.filter(a => a.status === 'down').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{apis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search/Filter Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search your APIs..."
          className="pl-10 rounded-xl bg-card/50 border-border/50 focus-visible:ring-primary/20 h-11"
        />
      </div>

      {/* API List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-muted/20 animate-pulse border border-border/10" />
          ))}
        </div>
      ) : apis.length === 0 ? (
        <Card className="border-border/50 bg-card/50 border-dashed py-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <Globe className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <CardTitle className="text-lg">No Monitors Found</CardTitle>
          <CardDescription className="max-w-sm mt-2">
            You haven't added any API monitors to this project yet. Start by adding your first endpoint.
          </CardDescription>
          <Link href="/new-api" className="mt-6">
            <Button variant="outline" className="rounded-xl">
              Create First Monitor
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apis.map((api) => (
            <Card key={api._id} className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                  {/* Status Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-105",
                    api.status === 'healthy' ? "bg-green-500/10 text-green-500" :
                      api.status === 'down' ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                  )}>
                    <Activity className="h-6 w-6" />
                  </div>

                  {/* API Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                        {api.name}
                      </h3>
                      <Badge variant="outline" className={cn("rounded-md text-[10px] p-0 px-1.5 h-5", getStatusColor(api.status))}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(api.status)}
                          {api.status}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold rounded-md bg-muted/50 border-0">
                          {api.method}
                        </Badge>
                        <span className="truncate max-w-[300px] font-mono text-xs opacity-70">
                          {api.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 opacity-70 border-l border-border/50 pl-3">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Expects:</span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold border-primary/20 text-primary">
                            {api.expectedStatus}
                          </Badge>
                          {api.expectedResponseStructure && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold border-purple-500/20 text-purple-500">
                              JSON Match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-70 border-l border-border/50 pl-3">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px]">{api.lastChecked || 'Never'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-primary hover:bg-primary/10"
                      onClick={() => setEditingApi(api)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(api._id)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === api._id}
                    >
                      {deleteMutation.isPending && deleteMutation.variables === api._id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditApiDialog
        api={editingApi}
        onClose={() => setEditingApi(null)}
        onSave={updateMutation.mutate}
        isSaving={updateMutation.isPending}
      />
    </div>
  )
}

interface EditApiDialogProps {
  api: API | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

const EditApiDialog = ({ api, onClose, onSave, isSaving }: EditApiDialogProps) => {
  const [name, setName] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [method, setMethod] = React.useState('GET')
  const [headersList, setHeadersList] = React.useState<{ key: string, value: string }[]>([])
  const [body, setBody] = React.useState('')
  const [expectedStatus, setExpectedStatus] = React.useState('200')
  const [expectedStructure, setExpectedStructure] = React.useState('')

  React.useEffect(() => {
    if (api) {
      setName(api.name)
      setUrl(api.url)
      setMethod(api.method)
      setExpectedStatus(api.expectedStatus.toString())
      setBody(api.body ? JSON.stringify(api.body, null, 2) : '')
      setExpectedStructure(api.expectedResponseStructure ? JSON.stringify(api.expectedResponseStructure, null, 2) : '')

      const h = Object.entries(api.headers || {}).map(([key, value]) => ({ key, value }))
      setHeadersList(h.length > 0 ? h : [{ key: '', value: '' }])
    }
  }, [api])

  const addHeader = () => {
    setHeadersList([...headersList, { key: '', value: '' }])
  }

  const removeHeader = (index: number) => {
    const newHeaders = [...headersList]
    newHeaders.splice(index, 1)
    setHeadersList(newHeaders.length > 0 ? newHeaders : [{ key: '', value: '' }])
  }

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headersList]
    newHeaders[index][field] = value
    setHeadersList(newHeaders)
  }

  const handleSave = () => {
    onSave({
      name,
      url,
      method,
      headers: headersList.filter(h => h.key.trim() !== ''),
      body,
      expectedStatus,
      expectedResponseStructure: expectedStructure
    })
  }

  return (
    <Dialog open={!!api} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="min-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl border-border/50 shadow-2xl font-sans">
        <DialogHeader>
          <DialogTitle>Edit API Monitor</DialogTitle>
          <DialogDescription>Update configuration for {api?.name}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-xl font-mono text-sm" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold opacity-70">Headers</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addHeader}
                  className="h-7 rounded-lg border-border/50 hover:bg-primary/10 hover:text-primary transition-all text-[10px] px-2"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Header
                </Button>
              </div>
              <div className="space-y-2">
                {headersList.map((header, index) => (
                  <div key={index} className="flex gap-2 items-start group">
                    <Input
                      placeholder="Key"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      className="flex-1 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all font-mono text-xs h-9"
                    />
                    <Input
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      className="flex-1 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all font-mono text-xs h-9"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 w-9 shrink-0"
                      disabled={headersList.length === 1 && !header.key && !header.value}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Status</Label>
              <Input value={expectedStatus} onChange={(e) => setExpectedStatus(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Conditional Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label>Request Body (JSON)</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="rounded-xl font-mono text-xs min-h-[100px]"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          {/* Expected Response Structure */}
          <div className="space-y-2">
            <Label>Expected Response Structure (JSON)</Label>
            <Textarea
              value={expectedStructure}
              onChange={(e) => setExpectedStructure(e.target.value)}
              className="rounded-xl font-mono text-xs min-h-[100px]"
              placeholder='{"status": "success", "data": {}}'
            />
            <p className="text-[10px] text-muted-foreground ml-1 italic">
              Optional: We will validate if the real response matches this JSON structure.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-8 shadow-lg shadow-primary/20">
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ApisPage