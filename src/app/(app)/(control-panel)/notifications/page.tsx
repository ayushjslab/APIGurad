"use client"

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Bell,
    CheckCheck,
    AlertCircle,
    Info,
    AlertTriangle,
    ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
    _id: string;
    type: 'error' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

const NotificationsPage = () => {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const { data: notificationsData, isLoading } = useQuery<NotificationsResponse>({
        queryKey: ['notifications', page, filter],
        queryFn: async () => {
            const response = await fetch(`/api/notifications?page=${page}&unreadOnly=${filter === 'unread'}`)
            if (!response.ok) throw new Error('Failed to fetch notifications')
            return response.json()
        }
    })

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
            if (!response.ok) throw new Error('Failed to mark as read')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
        }
    })

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/notifications', { method: 'POST' })
            if (!response.ok) throw new Error('Failed to mark all as read')
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">Loading alerts...</p>
                </div>
            </div>
        )
    }

    const notifications = notificationsData?.notifications || []
    const unreadCount = notificationsData?.unreadCount || 0

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'success': return <CheckCheck className="h-5 w-5 text-emerald-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    }

    return (
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <span className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <Bell className="h-8 w-8" />
                        </span>
                        Notifications
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        View and manage alerts from your monitoring activity.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                        className="rounded-xl gap-2 h-11 px-6 font-bold shadow-lg shadow-primary/20"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 border-b border-border/50 pb-4">
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className="rounded-lg font-bold"
                >
                    All
                </Button>
                <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setFilter('unread'); setPage(1); }}
                    className="rounded-lg font-bold relative"
                >
                    Unread
                    {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20 bg-card/5 backdrop-blur-sm rounded-3xl border border-dashed border-border/50"
                        >
                            <div className="inline-flex p-4 rounded-full bg-muted/20 mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground opacity-30" />
                            </div>
                            <h3 className="text-xl font-bold">All caught up!</h3>
                            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                                You don't have any {filter === 'unread' ? 'unread ' : ''}notifications at the moment.
                            </p>
                        </motion.div>
                    ) : (
                        notifications.map((notification, index) => (
                            <motion.div
                                key={notification._id}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card className={cn(
                                    "border-border/50 transition-all hover:bg-muted/5 group",
                                    !notification.isRead && "bg-primary/5 border-primary/20 ring-1 ring-primary/10 shadow-lg shadow-primary/5"
                                )}>
                                    <div className="flex p-5 gap-4">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-xl h-fit",
                                            notification.type === 'error' ? "bg-red-500/10" :
                                                notification.type === 'warning' ? "bg-amber-500/10" :
                                                    "bg-blue-500/10"
                                        )}>
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <h4 className={cn(
                                                    "font-bold truncate",
                                                    !notification.isRead ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center gap-4 mt-4">
                                                {notification.link && (
                                                    <Link href={notification.link}>
                                                        <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-[10px] font-black uppercase border-border/50">
                                                            View Details <ChevronRight size={12} />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {!notification.isRead && (
                                                    <Button
                                                        onClick={() => markAsReadMutation.mutate(notification._id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 rounded-lg text-primary hover:text-primary hover:bg-primary/10 text-[10px] font-black uppercase"
                                                    >
                                                        Mark as read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {notificationsData && notificationsData.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                    {Array.from({ length: notificationsData.pagination.pages }).map((_, i) => (
                        <Button
                            key={i}
                            variant={page === i + 1 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(i + 1)}
                            className="w-10 h-10 rounded-xl font-bold"
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default NotificationsPage
