"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineMenuAlt3, HiOutlineX } from 'react-icons/hi'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { Zap } from 'lucide-react'

const HomeNavbar = () => {
    const { data: session } = authClient.useSession()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Documentation', href: '/docs' },
    ]

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                isScrolled ? "bg-background/60 backdrop-blur-xl border-b border-border/40 py-3" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/10">
                        <Zap className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-foreground uppercase">
                        API<span className="text-primary italic">Guard</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* CTAs */}
                <div className="hidden md:flex items-center gap-4">
                    {session ? (
                        <Link href="/dashboard">
                            <Button className="rounded-xl px-6 font-black uppercase tracking-widest h-11 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/signin">
                                <Button variant="ghost" className="font-bold text-sm uppercase tracking-widest hover:bg-primary/5">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/signin">
                                <Button className="rounded-xl px-6 font-black uppercase tracking-widest h-11 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-foreground"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <HiOutlineX size={28} /> : <HiOutlineMenuAlt3 size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-background/95 backdrop-blur-2xl border-b border-border/50 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-black text-muted-foreground uppercase tracking-widest"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
                                {session ? (
                                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full rounded-xl h-12 font-black uppercase">Dashboard</Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full rounded-xl h-12 font-black uppercase">Sign In</Button>
                                        </Link>
                                        <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full rounded-xl h-12 font-black uppercase">Get Started</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

export default HomeNavbar
