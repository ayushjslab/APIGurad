"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Zap,
    Eye,
    History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    totalSuccess: number;
    totalFails: number;
    lastResponseTime?: number;
    interval: string;
    createdAt: string;
}

interface LogsResponse {
    logs: Log[];
    timeline: {
        timestamp: string | null;
        status: "success" | "error" | "inactive";
    }[] | null;
    meta: {
        status: string;
        totalSuccess: number;
        totalFails: number;
        consecutiveFails: number;
        interval: string;
    } | null;
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
            const response = await fetch(`/api/apis/${id}`)
            if (!response.ok) throw new Error('Failed to fetch API details')
            return response.json()
        },
        enabled: !!id
    })

    const reliability = React.useMemo(() => {
        if (!apiDetails) return 100
        const success = apiDetails.totalSuccess ?? 0
        const fails = apiDetails.totalFails ?? 0
        const total = success + fails
        if (total === 0) return 100
        return Math.round((success / total) * 1000) / 10
    }, [apiDetails])

    const successPhase = React.useMemo(() => {
        const success = apiDetails?.totalSuccess ?? 0
        if (success > 1000) return { label: 'Rock Solid', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
        if (success > 500) return { label: 'Highly Reliable', color: 'text-green-500', bg: 'bg-green-500/10' }
        if (success > 100) return { label: 'Established', color: 'text-blue-500', bg: 'bg-blue-500/10' }
        return { label: 'Ramping Up', color: 'text-muted-foreground', bg: 'bg-muted/10' }
    }, [apiDetails])

    const { data: logsData, isLoading } = useQuery<LogsResponse>({
        queryKey: ['api-logs', id, page],
        queryFn: async () => {
            const response = await fetch(`/api/logs/${id}?page=${page}&limit=20&includeTimeline=true`)
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-border/50 bg-card/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="h-24 w-24 text-green-500" />
                    </div>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Health Score</p>
                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase rounded-full px-2 border-none", successPhase.bg, successPhase.color)}>
                                {successPhase.label}
                            </Badge>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className={cn(
                                "text-6xl font-black tracking-tighter",
                                reliability > 95 ? "text-green-500" : reliability > 80 ? "text-amber-500" : "text-red-500"
                            )}>{reliability}%</h2>
                            <span className="text-sm font-bold text-muted-foreground/50 italic">uptime</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-border/50 bg-card/10 backdrop-blur-md">
                    <CardContent className="pt-6 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mb-1">Performance Details</p>
                                <div className="flex gap-6 mt-3">
                                    <div>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Last Latency</p>
                                        <p className="text-xl font-bold font-mono">{apiDetails?.lastResponseTime || 0}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Success Count</p>
                                        <p className="text-xl font-bold text-green-500">{apiDetails?.totalSuccess || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Incident History</p>
                                        <p className="text-xl font-bold text-red-500">{apiDetails?.totalFails || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-primary/5 text-primary">
                                <Zap className="h-6 w-6 animate-pulse" />
                            </div>
                        </div>

                        {/* Uptime Visualizer (Modern Timeline) */}
                        <div className="pt-4 space-y-2">
                            <div className="flex justify-between text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                                <span>Recent checks (Last 90) · {(apiDetails?.totalSuccess ?? 0) + (apiDetails?.totalFails ?? 0)} total</span>
                                <span className={cn(
                                    "font-black uppercase tracking-wider",
                                    (logsData?.meta?.status || apiDetails?.status) === 'healthy' ? 'text-green-500' :
                                        (logsData?.meta?.status || apiDetails?.status) === 'down' ? 'text-red-500' :
                                            (logsData?.meta?.status || apiDetails?.status) === 'disabled' ? 'text-amber-500' :
                                                'text-muted-foreground'
                                )}>{logsData?.meta?.status || apiDetails?.status || '...'}</span>
                            </div>
                            <div className="flex gap-[2px] h-6 w-full items-end">
                                {(logsData?.timeline ?? Array.from({ length: 90 })).map((bucket, i) => {
                                    const status = typeof bucket === 'object' && 'status' in bucket ? bucket.status : 'inactive';
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex-1 rounded-sm transition-all hover:brightness-125 cursor-pointer relative group/bar self-end",
                                                status === 'error'
                                                    ? "bg-red-500 h-6 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                                    : status === 'success'
                                                        ? "bg-green-500/80 h-5"
                                                        : "bg-muted/30 h-3"
                                            )}
                                            title={typeof bucket === 'object' && bucket.timestamp
                                                ? `${new Date(bucket.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${new Date(bucket.timestamp).toLocaleDateString()}: ${status.toUpperCase()}`
                                                : status === 'inactive' ? 'Monitor not yet active' : ''
                                            }
                                        >
                                            {status === 'error' && (
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-between text-[8px] text-muted-foreground px-1 pt-0.5">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-sm bg-green-500/70"></span>OK
                                    <span className="inline-block w-2 h-2 rounded-sm bg-red-500"></span>Fail
                                    <span className="inline-block w-2 h-2 rounded-sm bg-muted/30"></span>Inactive
                                </span>
                                <span>{logsData?.meta?.consecutiveFails ?? 0} consecutive fails now</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Incident History Table */}
            <Card className="border-border/50 bg-card/5 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <CardHeader className="pb-2 pt-8 px-8 relative">
                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Incident & Failure History
                        <Badge variant="outline" className="rounded-xl font-bold text-[10px] px-2 h-5 border-red-500/20 bg-red-500/5 text-red-500">
                            {logsData?.pagination.total || 0} TOTAL INCIDENTS
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground ml-8">We only record persistent logs for failed health checks to optimize system performance.</p>
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
