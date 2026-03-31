"use client"

import React from 'react'
import PricingPlans from '@/components/shared/pricing-plans'
import HomeNavbar from '@/components/shared/home-navbar'
import { motion } from 'framer-motion'

const MarketingPricingPage = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-20" />
                <div className="absolute top-[100px] right-[-100px] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] opacity-10" />
            </div>

            <HomeNavbar />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <PricingPlans showHeader={true} />
                </div>
            </main>

            <footer className="py-10 border-t border-border/30 text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">© 2026 APIGuard Systems. All rights reserved.</p>
            </footer>
        </div>
    )
}

export default MarketingPricingPage
