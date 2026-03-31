"use client"

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Layout,
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Search,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  plan: {
    name: string;
    apiCredits: number;
    projectCredits: number;
    totalChecks: number;
    usedChecks: number;
    currentApis: number;
    currentProjects: number;
  };
  stats: {
    totalMonitors: number;
    totalProjects: number;
    totalSuccess: number;
    totalFails: number;
    statusDistribution: {
      healthy: number;
      down: number;
      disabled: number;
      pending: number;
    };
  };
  projects: {
    _id: string;
    name: string;
    createdAt: string;
    monitorCount: number;
    healthyCount: number;
    failingCount: number;
  }[];
}

const DashboardPage = () => {
  const router = useRouter()
  const { data: dashboardData, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      return response.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Aggregating your data...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

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

  const successRate = dashboardData.stats.totalSuccess + dashboardData.stats.totalFails > 0
    ? Math.round((dashboardData.stats.totalSuccess / (dashboardData.stats.totalSuccess + dashboardData.stats.totalFails)) * 100)
    : 100

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Account <span className="text-primary">Overview</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Real-time status of your monitoring infrastructure and plan usage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl gap-2 h-11 border-border/50 bg-background/50 backdrop-blur-md">
            <Search className="h-4 w-4" />
            Quick Find
          </Button>
          <Button className="rounded-xl gap-2 h-11 shadow-lg shadow-primary/20">
            <Zap className="h-4 w-4" />
            Run All Checks
          </Button>
        </div>
      </div>

      {/* Top Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Projects', value: dashboardData.stats.totalProjects, icon: Layout, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active Monitors', value: dashboardData.stats.totalMonitors, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Overall Success', value: `${successRate}%`, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Active Incidents', value: dashboardData.stats.statusDistribution.down, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-border/50 bg-card/10 backdrop-blur-md hover:bg-card/20 transition-all duration-300 group overflow-hidden relative">
              <div className={cn("absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500", stat.color)}>
                <stat.icon size={100} strokeWidth={1} />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-xl", stat.bg, stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black tabular-nums tracking-tighter">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Plan & Usage */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
          <Card className="border-primary/20 bg-linear-to-br from-primary/10 to-transparent backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap className="h-24 w-24 text-primary" />
            </div>
            <CardHeader>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] uppercase font-black text-primary tracking-[0.2em]">Active Plan</p>
                <Badge variant="secondary" className="rounded-full bg-primary/20 text-primary border-none text-[10px] font-bold px-3">
                  {dashboardData.plan.name.toUpperCase()}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">{dashboardData.plan.name} Tier</CardTitle>
              <CardDescription className="text-xs">Your current resource usage and quotas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'API Credits', used: dashboardData.plan.currentApis, total: dashboardData.plan.apiCredits },
                { label: 'Project Credits', used: dashboardData.plan.currentProjects, total: dashboardData.plan.projectCredits },
                { label: 'Monthly Health Checks', used: dashboardData.plan.usedChecks, total: dashboardData.plan.totalChecks }
              ].map((usage, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">{usage.label}</span>
                    <span className="text-foreground">
                      {usage.used.toLocaleString()} <span className="text-muted-foreground opacity-50">/ {usage.total.toLocaleString()}</span>
                    </span>
                  </div>
                  <Progress value={(usage.used / usage.total) * 100} className="h-1.5 bg-background/50" />
                </div>
              ))}
              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 mt-4 h-11 font-bold tracking-tight">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/10 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold tracking-tight">Monitor Health Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Healthy', count: dashboardData.stats.statusDistribution.healthy, color: 'bg-green-500', text: 'text-green-500' },
                { label: 'Failing', count: dashboardData.stats.statusDistribution.down, color: 'bg-red-500', text: 'text-red-500' },
                { label: 'Disabled', count: dashboardData.stats.statusDistribution.disabled, color: 'bg-amber-500', text: 'text-amber-500' },
                { label: 'Pending', count: dashboardData.stats.statusDistribution.pending, color: 'bg-blue-500', text: 'text-blue-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", item.color)} />
                    <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 px-8">
                    <div className="h-1 flex-1 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                        style={{ width: `${dashboardData.stats.totalMonitors > 0 ? (item.count / dashboardData.stats.totalMonitors) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-black tabular-nums w-8 text-right">{item.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Projects Overview */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight">Project Health</h2>
            <Button variant="ghost" size="sm" className="text-primary text-xs font-bold hover:bg-primary/5 rounded-lg" onClick={() => router.push('/manage-project')}>
              View All Projects
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.projects.map((project) => (
              <motion.div
                key={project._id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card className="border-border/50 bg-card/10 backdrop-blur-md overflow-hidden cursor-pointer group hover:border-primary/20 transition-all" onClick={() => {
                  // Normally we would setActiveProject here, but since it's a global overview we just link
                  router.push('/apis')
                }}>
                  <CardContent className="p-0">
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{project.name}</h3>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Created {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                          {project.monitorCount} Monitors
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 rounded-2xl bg-green-500/5 space-y-1">
                          <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Healthy</span>
                          </div>
                          <p className="text-2xl font-black text-green-500/80">{project.healthyCount}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-red-500/5 space-y-1">
                          <div className="flex items-center gap-2 text-red-500">
                            <XCircle className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Down</span>
                          </div>
                          <p className="text-2xl font-black text-red-500/80">{project.failingCount}</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-muted/20">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${project.monitorCount > 0 ? (project.healthyCount / project.monitorCount) * 100 : 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {dashboardData.projects.length < dashboardData.plan.projectCredits && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card
                  className="border-dashed border-2 border-border/50 bg-transparent hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center p-8 transition-all group h-full grow min-h-[160px]"
                  onClick={() => router.push('/new-project')}
                >
                  <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all mb-3 text-2xl font-bold">
                    +
                  </div>
                  <p className="font-bold text-sm text-foreground/70 group-hover:text-primary transition-colors">Create New Project</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{dashboardData.plan.projectCredits - dashboardData.plan.currentProjects} spots remaining</p>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DashboardPage