'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldCheck, XCircle, ArrowRight } from 'lucide-react'
import TokenManager from '@/utils/tokenManager'
import { isLoggedIn } from '@/utils/authUtils'

interface UUIDLoginResponse {
    user: string
    user_id: number
    message: string
    access: string
    refresh: string
    token_type: string
    expires_in: string
}

interface UUIDLoginError {
    message: string
    error: string
}

export default function UUIDAutoLoginPage() {
    const router = useRouter()
    const params = useParams()
    const uuid = params.uuid as string

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [error, setError] = useState<string>('')
    const [message, setMessage] = useState<string>('Authenticating...')

    useEffect(() => {
        // If user is already logged in, redirect to dashboard
        if (isLoggedIn()) {
            router.push('/')
            return
        }

        // Validate UUID format (must be a valid UUID v4 format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(uuid)) {
            setStatus('error')
            setError('Invalid UUID format')
            return
        }

        // Perform UUID login
        const performLogin = async () => {
            try {
                setMessage('Validating access token...')

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/uuid-login/?uuid=${uuid}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'ngrok-skip-browser-warning': 'true',
                        },
                    }
                )

                const data = await response.json()

                if (response.ok && data.access) {
                    setMessage('Login successful! Redirecting...')
                    setStatus('success')

                    // Store tokens using TokenManager (with rememberMe = true for auto-login)
                    TokenManager.storeTokens(
                        {
                            accessToken: data.access,
                            refreshToken: data.refresh,
                            userEmail: data.user,
                            userData: {
                                user_id: data.user_id,
                                email: data.user,
                            },
                        },
                        true // Remember me = true for UUID auto-login
                    )

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        router.push('/')
                    }, 1000)
                } else {
                    // Handle error response
                    const errorData = data as UUIDLoginError
                    setStatus('error')
                    setError(errorData.message || errorData.error || 'Login failed')
                }
            } catch (err) {
                console.error('UUID Login error:', err)
                setStatus('error')
                setError('An error occurred while authenticating. Please try again.')
            }
        }

        performLogin()
    }, [uuid, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Cyber Security Background Elements */}
            <div className="fixed inset-0 z-0">
                {/* Animated Binary Code Stream */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent opacity-20 animate-scroll"></div>

                {/* Glowing Orbs */}
                <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-3000"></div>

                {/* Grid Background */}
                <div className="absolute inset-0 bg-grid-small-white/5"></div>

                {/* Floating Particles */}
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={`particle-${i}`}
                        className="absolute w-0.5 h-0.5 bg-primary/40 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `particle ${10 + (i % 10)}s linear infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Auto Login Card */}
            <div className="w-full max-w-md relative z-10">
                <Card className="shadow-lg bg-background/90 backdrop-blur-md">
                    <CardHeader className="space-y-1 text-center">
                        {status === 'loading' && (
                            <>
                                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Auto Sign In</CardTitle>
                                <CardDescription>{message}</CardDescription>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="mx-auto mb-4 p-4 bg-green-500/10 rounded-full w-fit">
                                    <ShieldCheck className="h-8 w-8 text-green-500" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-green-600">
                                    Welcome!
                                </CardTitle>
                                <CardDescription>
                                    {message}
                                </CardDescription>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="mx-auto mb-4 p-4 bg-destructive/10 rounded-full w-fit">
                                    <XCircle className="h-8 w-8 text-destructive" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-destructive">
                                    Authentication Failed
                                </CardTitle>
                                <CardDescription>
                                    Unable to sign in with the provided link
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {status === 'error' && (
                            <>
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={() => router.push('/login')}
                                        className="w-full"
                                    >
                                        Go to Login Page
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                        className="w-full"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </>
                        )}

                        {status === 'loading' && (
                            <div className="space-y-2">
                                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full animate-pulse w-2/3"></div>
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    Please wait while we verify your access...
                                </p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="space-y-2">
                                <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full w-full"></div>
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    Redirecting to dashboard...
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
        @keyframes scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }

        @keyframes particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(calc(-50vw + (var(--x) * 100vw))); opacity: 0; }
        }

        .bg-grid-small-white/5 {
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
          background-size: 40px 40px;
        }

        .animate-scroll {
          animation: scroll 120s linear infinite;
        }

        .animate-pulse {
          animation: pulse 8s ease-in-out infinite;
        }

        .delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
        </div>
    )
}
