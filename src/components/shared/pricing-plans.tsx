"use client"

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Check,
    Zap,
    Shield,
    Crown,
    ArrowRight,
    Activity,
    Globe,
    Lock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlanData {
    plan: 'free' | 'paid';
    apiCredits: number;
    projectCredits: number;
    totalChecks: number;
    usedChecks: number;
}

const PricingPlans = ({ showHeader = true }: { showHeader?: boolean }) => {
    const queryClient = useQueryClient()
    const { data: planData, isLoading } = useQuery<PlanData>({
        queryKey: ['plan-usage'],
        queryFn: async () => {
            const response = await fetch('/api/plan/usage')
            if (!response.ok) throw new Error('Failed to fetch plan usage')
            return response.json()
        }
    })

    const upgradeMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/plan/upgrade', { method: 'POST' })
            if (!response.ok) throw new Error('Failed to upgrade plan')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-usage'] })
        }
    })

    const tiers = [
        {
            name: 'Free Trial',
            id: 'free',
            price: '$0',
            description: 'Perfect for small projects and individual developers.',
            features: [
                '1 Project',
                '5 API Monitors',
                '100 Monthly Checks',
                '5 min Minimum Interval',
                '7 Days Log History',
                'Community Support'
            ],
            icon: Shield,
            color: 'slate',
        },
        {
            name: 'Pro Plan',
            id: 'paid',
            price: '$19',
            description: 'Advanced monitoring for growing teams and startups.',
            features: [
                '10 Projects',
                '100 API Monitors',
                '50,000 Monthly Checks',
                '1 min Frequency',
                '30 Days Log History',
                '24/7 Priority Support',
                'Custom Alerts (Email, Webhook)',
                'Priority Processing'
            ],
            icon: Crown,
            color: 'primary',
            highlight: true
        }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-12">
            {/* Header */}
            {showHeader && (
                <div className="text-center space-y-4 pt-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest"
                    >
                        <Zap className="h-3 w-3" />
                        Flexible Monitoring Plans
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
                        Choose Your <span className="text-primary italic">Scale.</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
                        From simple heartbeats to distributed system monitoring, we have a plan that fits your infrastructure needs.
                    </p>
                </div>
            )}

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
                {tiers.map((tier, index) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative h-full"
                    >
                        {tier.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/40">
                                Most Popular
                            </div>
                        )}

                        <Card className={cn(
                            "h-full border-border/50 bg-card/10 backdrop-blur-md overflow-hidden flex flex-col group transition-all duration-500",
                            tier.highlight && "ring-2 ring-primary/40 scale-[1.02] shadow-2xl shadow-primary/10"
                        )}>
                            <CardHeader className="pb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn(
                                        "p-3 rounded-2xl",
                                        tier.id === 'paid' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <tier.icon className="h-6 w-6" />
                                    </div>
                                    {planData?.plan === tier.id && (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg px-2.5 py-1 border-emerald-500/30">
                                            Current Plan
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-black">{tier.name}</CardTitle>
                                <CardDescription className="text-sm min-h-[40px] pt-1">{tier.description}</CardDescription>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-5xl font-black">{tier.price}</span>
                                    <span className="text-muted-foreground font-bold text-sm">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col space-y-8">
                                <div className="space-y-4 flex-1">
                                    {tier.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex items-center gap-3">
                                            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm font-semibold">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {planData?.plan === tier.id ? (
                                    <Button disabled className="w-full h-14 rounded-2xl bg-muted/50 text-muted-foreground font-black uppercase tracking-widest cursor-not-allowed">
                                        Selected
                                    </Button>
                                ) : tier.id === 'paid' ? (
                                    <Button
                                        onClick={() => upgradeMutation.mutate()}
                                        disabled={upgradeMutation.isPending}
                                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                                    >
                                        {upgradeMutation.isPending ? 'Upgrading...' : 'Upgrade Now'} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full h-14 rounded-2xl border-border/50 text-foreground font-black uppercase tracking-widest">
                                        Downgrade
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Feature Comparison */}
            <div className="pt-10">
                <h2 className="text-2xl font-black text-center mb-10">Detailed Feature Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Activity, title: 'Check Intervals', free: '5 minutes', paid: '1 minute' },
                        { icon: Globe, title: 'Monitor Count', free: 'Up to 5 APIs', paid: 'Up to 100 APIs' },
                        { icon: Lock, title: 'History Retention', free: '7 Days Logs', paid: '30 Days Logs' },
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-white/5 border border-border/50 space-y-4">
                            <div className="p-2 w-fit rounded-xl bg-primary/10 text-primary">
                                <item.icon size={20} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wider">{item.title}</h3>
                            <div className="flex items-center justify-between py-1 border-b border-border/30">
                                <span className="text-xs text-muted-foreground font-medium">Free</span>
                                <span className="text-xs font-bold">{item.free}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-xs text-muted-foreground font-medium">Pro</span>
                                <span className="text-xs font-black text-primary">{item.paid}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PricingPlans
