"use client"

import { useQuery } from '@tanstack/react-query'
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
    Activity,
    Zap,
    TrendingUp,
    Award,
    AlertTriangle,
    Clock,
    ExternalLink,
    Filter,
    Calendar,
    ChevronDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface GlobalStats {
    trend: {
        date: string;
        success: number;
        failure: number;
    }[];
    latency: {
        label: string;
        count: number;
    }[];
    status: {
        name: string;
        value: number;
    }[];
    performance: {
        fastest: {
            name: string;
            lastResponseTime: number;
            status: string;
        }[];
        slowest: {
            name: string;
            lastResponseTime: number;
            status: string;
        }[];
    }
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

const StatisticsPage = () => {
    const router = useRouter()
    const { data: stats, isLoading } = useQuery<GlobalStats>({
        queryKey: ['global-stats'],
        queryFn: async () => {
            const response = await fetch('/api/stats/global')
            if (!response.ok) throw new Error('Failed to fetch global stats')
            return response.json()
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Analyzing logs...</p>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <span className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <TrendingUp className="h-8 w-8" />
                        </span>
                        Insights <span className="text-primary">& Analytics</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Deep-dive analysis of your monitoring infrastructure performance and reliability.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl gap-2 h-11 border-border/50 bg-background/50 backdrop-blur-md">
                        <Calendar className="h-4 w-4" />
                        Last 7 Days
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                    <Button variant="outline" className="rounded-xl gap-2 h-11 border-border/50 bg-background/50 backdrop-blur-md">
                        <Filter className="h-4 w-4" />
                        All Projects
                    </Button>
                </div>
            </div>

            {/* Top Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reliability Trend */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50 bg-card/10 backdrop-blur-md h-full overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Reliability Trend</CardTitle>
                                    <CardDescription>Success vs. Failure ratio over the last 7 days</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="h-[300px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={stats.trend}>
                                        <defs>
                                            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#888', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#888', fontSize: 10, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ fontWeight: 700 }}
                                        />
                                        <Area type="monotone" dataKey="success" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="failure" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailure)" strokeWidth={3} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Latency Distribution */}
                <motion.div variants={itemVariants}>
                    <Card className="border-border/50 bg-card/10 backdrop-blur-md h-full overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Latency Distribution</CardTitle>
                                    <CardDescription>Breakdown of response times for all checks</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="h-[300px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <BarChart data={stats.latency}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#888', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#888', fontSize: 10, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#10B989', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {stats.latency.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.label.includes('>') ? '#ef4444' : entry.label.includes('<') ? '#10b981' : '#3b82f6'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Breakdown (Donut) */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="border-border/50 bg-card/10 backdrop-blur-md h-full">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-lg font-bold">Current Status Breakdown</CardTitle>
                            <CardDescription>Live health distribution of all APIs</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center flex-col">
                            <div className="h-[240px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie
                                            data={stats.status}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.status.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full px-4">
                                {stats.status.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.name}: {s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Performance Leaderboards */}
                <motion.div variants={itemVariants} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fastest */}
                    <Card className="border-border/50 bg-card/10 backdrop-blur-md overflow-hidden flex flex-col">
                        <CardHeader className="bg-green-500/5 py-4">
                            <div className="flex items-center gap-2 text-green-500">
                                <Award className="h-4 w-4" />
                                <CardTitle className="text-sm font-black uppercase tracking-wider">Fastest Response</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-white/5">
                                {stats.performance.fastest.map((api, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="text-[10px] font-black text-muted-foreground w-4 opacity-30">{i + 1}</div>
                                            <div className="truncate">
                                                <p className="text-sm font-bold truncate">{api.name}</p>
                                                <Badge variant="outline" className="text-[8px] h-4 mt-0.5 border-green-500/20 text-green-500 uppercase font-black">Stable</Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black tabular-nums text-green-500">{api.lastResponseTime}ms</p>
                                            <p className="text-[10px] text-muted-foreground font-bold group-hover:text-primary cursor-pointer flex items-center gap-1 justify-end">Details <ExternalLink className="h-2 w-2" /></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Slowest / High Latency */}
                    <Card className="border-border/50 bg-card/10 backdrop-blur-md overflow-hidden flex flex-col">
                        <CardHeader className="bg-red-500/5 py-4">
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertTriangle className="h-4 w-4" />
                                <CardTitle className="text-sm font-black uppercase tracking-wider">High Latency</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-white/5">
                                {stats.performance.slowest.map((api, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="text-[10px] font-black text-muted-foreground w-4 opacity-30">{i + 1}</div>
                                            <div className="truncate">
                                                <p className="text-sm font-bold truncate">{api.name}</p>
                                                <Badge variant={api.status === 'down' ? 'destructive' : 'outline'} className={cn("text-[8px] h-4 mt-0.5 uppercase font-black", api.status !== 'down' && "border-amber-500/20 text-amber-500")}>
                                                    {api.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black tabular-nums text-red-400">{api.lastResponseTime}ms</p>
                                            <p className="text-[10px] text-muted-foreground font-bold group-hover:text-primary cursor-pointer flex items-center gap-1 justify-end">Optimize <Zap className="h-2 w-2" /></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default StatisticsPage
