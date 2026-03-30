"use client"

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProject } from '@/context/project-context'
import {
  FileText,
  Search,
  Globe,
  Activity,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface API {
  _id: string;
  name: string;
  url: string;
  method: string;
  status: 'healthy' | 'down' | 'pending' | 'disabled';
  lastChecked?: string;
  totalSuccess?: number;
  totalFails?: number;
}

const LogsPage = () => {
  const { activeProject } = useProject()
  const [searchTerm, setSearchTerm] = React.useState('')

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

  const filteredApis = apis.filter(api =>
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'down': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'disabled': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          <FileText className="h-8 w-8" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Select a Project</h2>
          <p className="text-muted-foreground max-w-xs">Please select a project to view API logs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Check History</h1>
          <p className="text-muted-foreground">
            Historical logs for <span className="text-foreground font-medium">{activeProject.name}</span>
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Filter APIs by name or URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl bg-card/50 border-border/50 focus-visible:ring-primary/20 h-11"
        />
      </div>

      {/* API List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-3xl bg-muted/20 animate-pulse border border-border/10" />
          ))}
        </div>
      ) : filteredApis.length === 0 ? (
        <Card className="border-border/50 bg-card/50 border-dashed py-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <Globe className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <CardTitle className="text-lg">No APIs Found</CardTitle>
          <CardDescription className="max-w-sm mt-2">
            No API monitors match your search or haven't been created yet.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApis.map((api) => {
            const successRate = api.totalSuccess !== undefined && api.totalFails !== undefined
              ? (api.totalSuccess + api.totalFails) > 0
                ? ((api.totalSuccess / (api.totalSuccess + api.totalFails)) * 100).toFixed(1)
                : '100'
              : 'N/A'

            return (
              <Link href={`/logs/${api._id}`} key={api._id}>
                <Card className="group border-border/50 bg-card/50 hover:bg-card/80 transition-all hover:shadow-xl hover:shadow-primary/5 rounded-3xl overflow-hidden cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110",
                          api.status === 'healthy' ? "bg-green-500/10 text-green-500" :
                            api.status === 'down' ? "bg-red-500/10 text-red-500" :
                              api.status === 'disabled' ? "bg-zinc-500/10 text-zinc-400" :
                                "bg-blue-500/10 text-blue-500"
                        )}>
                          <Activity className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                              {api.name}
                            </h3>
                            <Badge variant="outline" className={cn("rounded-md text-[10px] p-0 px-1.5 h-4 uppercase font-bold", getStatusColor(api.status))}>
                              {api.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[400px] font-mono opacity-70">
                            {api.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="hidden md:flex flex-col items-end gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Success Rate</span>
                          <span className="text-sm font-black text-foreground">
                            {successRate}%
                          </span>
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Check</span>
                          <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {api.lastChecked ? new Date(api.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <ChevronRight className="h-5 w-5 opacity-30 group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LogsPage