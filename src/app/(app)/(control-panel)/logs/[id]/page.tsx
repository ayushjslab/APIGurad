"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Activity,
    Zap,
    Database,
    Search,
    ChevronDown,
    Eye,
    Shield,
    History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from '@/components/ui/dialog'

interface Log {
    _id: string;
    checkedAt: string;
    outcome: 'success' | 'error';
    httpStatus: number;
    responseTimeMs: number;
    statusMatched: boolean;
    structureMatched: boolean;
    errorMessage?: string;
    responseBody?: string;
}

interface ApiDetails {
    _id: string;
    name: string;
    url: string;
    method: string;
    status: string;
    expectedStatus: number;
}

interface LogsResponse {
    logs: Log[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

const LogDetailsPage = () => {
    const { id } = useParams()
    const router = useRouter()
    const [page, setPage] = React.useState(1)

    const { data: apiDetails } = useQuery<ApiDetails>({
        queryKey: ['api-details', id],
        queryFn: async () => {
            const response = await fetch(`/api/apis/detail?id=${id}`) // We might need a small detail route or filter from existing
            if (!response.ok) {
                // Fallback: try to find it in the project list if not found
                const res = await fetch(`/api/apis/${id}`)
                return res.json()
            }
            return response.json()
        }
    })

    const { data: logsData, isLoading } = useQuery<LogsResponse>({
        queryKey: ['api-logs', id, page],
        queryFn: async () => {
            const response = await fetch(`/api/logs/${id}?page=${page}&limit=20`)
            if (!response.ok) throw new Error('Failed to fetch logs')
            return response.json()
        },
        enabled: !!id
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500 mb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit gap-2 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/logs')}
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Check History
                </Button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <span className="p-2 rounded-2xl bg-primary/10 text-primary">
                                <History className="h-7 w-7" />
                            </span>
                            History: {apiDetails?.name || 'Loading...'}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm opacity-70 ml-12">
                            {apiDetails?.url}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Checks', value: logsData?.pagination.total || 0, icon: Search, color: 'text-blue-500' },
                    { label: 'Latency (Avg)', value: `${calculateAvgLatency(logsData?.logs ?? 0)}ms`, icon: Zap, color: 'text-amber-500' },
                    { label: 'Successes', value: logsData?.logs.filter(l => l.outcome === 'success').length ?? 0, icon: CheckCircle2, color: 'text-green-500' },
                    { label: 'Failures', value: logsData?.logs.filter(l => l.outcome === 'error').length ?? 0, icon: AlertCircle, color: 'text-red-500' },
                ].map((stat, i) => (
                    <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl bg-muted/50", stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stat.label}</p>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Logs Table */}
            <Card className="border-border/50 bg-card/50 rounded-3xl overflow-hidden">
                <CardHeader className="pb-0 pt-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                        Recent Health Checks
                        <Badge variant="secondary" className="rounded-md font-bold text-[10px] px-1.5 h-4">
                            PAGE {page}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground">Outcome</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground">Latency</th>
                                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-4 h-12 bg-muted/10"></td>
                                        </tr>
                                    ))
                                ) : logsData?.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No logs recorded for this monitor yet.
                                        </td>
                                    </tr>
                                ) : (
                                    logsData?.logs.map((log) => (
                                        <tr key={log._id} className="group hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{new Date(log.checkedAt).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(log.checkedAt).toLocaleTimeString([], { hour12: true })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "rounded-md text-[10px] px-1.5 h-5 font-bold uppercase",
                                                        log.outcome === 'success'
                                                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        {log.outcome === 'success' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                                        {log.outcome}
                                                    </span>
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        log.httpStatus === apiDetails?.expectedStatus ? "text-foreground" : "text-red-500"
                                                    )}>
                                                        HTTP {log.httpStatus || 'ERR'}
                                                    </span>
                                                    {!log.structureMatched && (
                                                        <span className="text-[9px] text-red-500 font-bold uppercase">Structure Mismatch</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-mono text-muted-foreground">{log.responseTimeMs}ms</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.outcome === 'error' ? (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive">
                                                                <Eye className="h-3.5 w-3.5" /> Inspect Failure
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl rounded-3xl border-border/50 shadow-2xl font-sans">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                                                    Failure Inspection
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Detailed check metadata from {new Date(log.checkedAt).toLocaleString()}
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1 p-3 rounded-2xl bg-muted/30 border border-border/50">
                                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Error Message</p>
                                                                        <p className="text-sm font-medium text-red-500">{log.errorMessage || 'Unknown Error'}</p>
                                                                    </div>
                                                                    <div className="space-y-1 p-3 rounded-2xl bg-muted/30 border border-border/50">
                                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Status Code</p>
                                                                        <p className="text-sm font-medium">Expected {apiDetails?.expectedStatus}, Got {log.httpStatus || 'None'}</p>
                                                                    </div>
                                                                </div>
                                                                {log.responseBody && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label className="text-xs font-bold opacity-70">Response Body Snippet</Label>
                                                                            <Badge variant="secondary" className="text-[9px] h-4">TRUNCATED</Badge>
                                                                        </div>
                                                                        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-[300px]">
                                                                            {log.responseBody}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground/40 font-medium italic">No errors to show</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logsData?.pagination && logsData.pagination.pages > 1 && (
                        <div className="px-6 py-4 flex items-center justify-between border-t border-border/50 bg-muted/10">
                            <p className="text-xs text-muted-foreground">
                                Showing {logsData.logs.length} of {logsData.pagination.total} results
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg h-8 px-3 text-xs"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg h-8 px-3 text-xs"
                                    onClick={() => setPage(p => Math.min(logsData.pagination.pages, p + 1))}
                                    disabled={page === logsData.pagination.pages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function calculateAvgLatency(logs: Log[] | number): number {
    if (!Array.isArray(logs) || logs.length === 0) return 0
    const sum = logs.reduce((acc, log) => acc + log.responseTimeMs, 0)
    return Math.round(sum / logs.length)
}

// Reuse Label from shadcn components if needed
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("text-xs font-medium", className)}>{children}</span>
)

export default LogDetailsPage
