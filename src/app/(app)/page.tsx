"use client"

import React from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Shield,
  BarChart3,
  Bell,
  ArrowRight,
  Globe,
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import HomeNavbar from '@/components/shared/home-navbar'
import Link from 'next/link'
import PricingPlans from '@/components/shared/pricing-plans'

const HomePage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 right-0 h-[1000px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div className="absolute top-[100px] right-[-100px] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-20" />
        <div className="absolute top-[400px] left-[30%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] opacity-10" />
      </div>

      <HomeNavbar />

      <main className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Hero Content */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="space-y-8 relative z-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
              <Zap className="h-3 w-3" />
              Next-Generation API Intelligence
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              Monitor <span className="text-primary italic">Every</span> Heartbeat.
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg font-medium">
              The professional monitoring platform for distributed systems.
              Get real-time health alerts, performance analytics, and reliability insights in one unified dashboard.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/signin">
                <Button size="lg" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Start Monitoring Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest border-border/50 bg-background/50 backdrop-blur-md hover:bg-muted/50">
                  View Pricing
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeIn} className="flex items-center gap-8 pt-8">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-4 border-background bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i + 12}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-foreground">Trusted by 2,000+ Teams</span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Across 40 countries</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Decorative Frames */}
            <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-transparent rounded-[40px] -rotate-6 blur-2xl opacity-20" />

            {/* Mock Dashboard Snippet */}
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-muted-foreground opacity-50">
                  dashboard_v2.api
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { name: 'Payment API', status: 'Healthy', latency: '42ms', color: 'emerald' },
                  { name: 'Auth Service', status: 'Failing', latency: '540ms', color: 'red' },
                  { name: 'Data Pipeline', status: 'Healthy', latency: '128ms', color: 'emerald' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group-hover:border-primary/20 transition-all cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full bg-${item.color}-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                      <span className="text-sm font-bold">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.latency}</span>
                  </motion.div>
                ))}
              </div>

              {/* Float Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-6 -right-4 bg-primary p-4 rounded-2xl shadow-xl shadow-primary/40 flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-white/20">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase opacity-80 leading-tight">Critical Alert</p>
                  <p className="text-xs font-bold text-white">Auth API is down!</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Feature Icons Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto"
        >
          {[
            { icon: Shield, label: 'Enterprise Security', desc: 'bank-grade encryption', id: 'features' },
            { icon: Globe, label: 'Global Edge', desc: '12 regions worldwide' },
            { icon: Cpu, label: 'Zero Overhead', desc: 'Low-latency monitoring' },
            { icon: BarChart3, label: 'Advanced Analytics', desc: 'Deep performance metrics' },
          ].map((feature, i) => (
            <div key={i} className="space-y-4 group" id={feature.id}>
              <div className="p-4 w-fit rounded-2xl bg-muted/50 border border-border/50 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider">{feature.label}</h3>
                <p className="text-xs text-muted-foreground font-medium">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pricing Section */}
        <section className="mt-40 max-w-7xl mx-auto px-6" id="pricing">
          <PricingPlans showHeader={true} />
        </section>
      </main>

      <footer className="py-10 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">© 2026 APIGuard Systems. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default HomePage