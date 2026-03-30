"use client"

import React, { useState } from 'react'
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FcGoogle } from "react-icons/fc"
import { HiOutlineShieldCheck, HiArrowRight } from "react-icons/hi"
import { toast } from "sonner"
import Link from 'next/link'

const SignInPage = () => {
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard"
            })
        } catch (error) {
            console.error("Sign in failed", error)
            toast.error("Failed to sign in with Google")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-2xl shadow-primary/20">
                        A
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight">API Monitor</h1>
                        <p className="text-muted-foreground text-sm">Empowering your API observability</p>
                    </div>
                </div>

                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardHeader className="space-y-1 pb-6 text-center">
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>
                            Sign in to your account to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={handleGoogleSignIn}
                            className="h-12 text-base font-medium rounded-xl border-border/50 hover:bg-muted/50 hover:border-primary/20 transition-all gap-3"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <FcGoogle className="w-5 h-5" />
                            )}
                            Continue with Google
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or securely access with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <HiOutlineShieldCheck className="text-primary w-6 h-6" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold">Enterprise Ready</span>
                                    <span className="text-[10px] text-muted-foreground">OAuth 2.0 Secure Protocols</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t border-border/50 bg-muted/20 pt-6">
                        <div className="text-xs text-center text-muted-foreground">
                            By clicking continue, you agree to our{" "}
                            <Link href="/terms" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Privacy Policy
                            </Link>
                            .
                        </div>
                    </CardFooter>
                </Card>

                <div className="mt-8 flex justify-center items-center gap-2 text-sm text-muted-foreground">
                    <span>New to API Monitor?</span>
                    <Link href="/docs" className="text-primary font-medium hover:underline flex items-center gap-1 group">
                        Explore Docs
                        <HiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SignInPage