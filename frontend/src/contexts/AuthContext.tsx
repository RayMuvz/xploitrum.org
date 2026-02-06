'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'

// Types
interface User {
    id: number
    username: string
    email: string
    full_name?: string
    role: string
    score: number
    rank?: number
    total_solves: number
    total_attempts: number
    created_at: string
    last_login?: string
    is_active: boolean
    must_change_password?: boolean
    idle_timeout_seconds?: number
    absolute_timeout_seconds?: number
}

interface AuthTokens {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    idle_timeout_seconds?: number
    absolute_timeout_seconds?: number
}

interface AuthContextType {
    user: User | null
    tokens: AuthTokens | null
    isLoading: boolean
    isAuthenticated: boolean
    showSessionWarning: boolean
    login: (username: string, password: string) => Promise<void>
    register: (userData: RegisterData) => Promise<void>
    logout: () => void
    refreshToken: () => Promise<void>
    extendSession: () => Promise<void>
    updateProfile: (profileData: Partial<User>) => Promise<void>
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

interface RegisterData {
    username: string
    email: string
    password: string
    full_name?: string
    bio?: string
    country?: string
    university?: string
}

// Session warning modal (shown before idle timeout)
function SessionWarningModal({
    onStayLoggedIn,
    onLogout,
}: {
    onStayLoggedIn: () => void
    onLogout: () => void
}) {
    const [extending, setExtending] = useState(false)
    const handleStay = async () => {
        setExtending(true)
        try {
            await onStayLoggedIn()
        } finally {
            setExtending(false)
        }
    }
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="cyber-border max-w-md rounded-lg bg-card p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Session expiring soon</h3>
                <p className="text-gray-400 text-sm mb-6">
                    You have been inactive. Stay logged in to continue, or log out now.
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                        Log out
                    </button>
                    <button
                        type="button"
                        onClick={handleStay}
                        disabled={extending}
                        className="px-4 py-2 rounded-lg bg-cyber-400 text-black font-medium hover:bg-cyber-300 disabled:opacity-50 transition-colors"
                    >
                        {extending ? 'Extending...' : 'Stay logged in'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage keys and helpers for "close all tabs = logout"
const AUTH_TOKENS_KEY = 'auth_tokens'
const USER_KEY = 'user'

function persistTokens(tokens: AuthTokens) {
    if (typeof window === 'undefined') return
    const s = JSON.stringify(tokens)
    sessionStorage.setItem(AUTH_TOKENS_KEY, s)
    localStorage.setItem(AUTH_TOKENS_KEY, s)
}

function persistUser(user: User) {
    if (typeof window === 'undefined') return
    const s = JSON.stringify(user)
    sessionStorage.setItem(USER_KEY, s)
    localStorage.setItem(USER_KEY, s)
}

function clearAuthStorage() {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(AUTH_TOKENS_KEY)
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(AUTH_TOKENS_KEY)
    localStorage.removeItem(USER_KEY)
}

/** Clear only localStorage so that when all tabs are closed, next visit has no tokens (logged out). */
function clearLocalStorageAuth() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(AUTH_TOKENS_KEY)
    localStorage.removeItem(USER_KEY)
}

function getStoredTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null
    const s = sessionStorage.getItem(AUTH_TOKENS_KEY) || localStorage.getItem(AUTH_TOKENS_KEY)
    if (!s) return null
    try {
        return JSON.parse(s) as AuthTokens
    } catch {
        return null
    }
}

function getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    const s = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)
    if (!s) return null
    try {
        return JSON.parse(s) as User
    } catch {
        return null
    }
}

/** When we restore from localStorage (new tab), copy to sessionStorage so this tab has the session. */
function copyLocalAuthToSession() {
    if (typeof window === 'undefined') return
    const t = localStorage.getItem(AUTH_TOKENS_KEY)
    const u = localStorage.getItem(USER_KEY)
    if (t) sessionStorage.setItem(AUTH_TOKENS_KEY, t)
    if (u) sessionStorage.setItem(USER_KEY, u)
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

// Auth provider component
const SESSION_WARNING_BEFORE_SECONDS = 120 // Show warning 2 min before idle timeout

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [tokens, setTokens] = useState<AuthTokens | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showSessionWarning, setShowSessionWarning] = useState(false)
    const lastActivityAt = useRef<number>(Date.now())
    const router = useRouter()
    const { toast } = useToast()

    const isAuthenticated = !!user && !!tokens
    const idleTimeoutSeconds = tokens?.idle_timeout_seconds ?? user?.idle_timeout_seconds ?? 30 * 60

    const clearAuthData = useCallback(() => {
        clearAuthStorage()
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
        setTokens(null)
        setShowSessionWarning(false)
    }, [])

    // 401 response interceptor: session expired → clear auth and redirect to login
    useEffect(() => {
        const id = axios.interceptors.response.use(
            (response) => {
                if (response?.config?.url?.includes('/api/') && response?.status >= 200 && response?.status < 300) {
                    lastActivityAt.current = Date.now()
                }
                return response
            },
            (error) => {
                if (error.response?.status === 401) {
                    clearAuthData()
                    router.push('/login')
                    toast({
                        title: 'Session expired',
                        description: 'Please log in again.',
                        variant: 'destructive',
                    })
                }
                return Promise.reject(error)
            }
        )
        return () => {
            axios.interceptors.response.eject(id)
        }
    }, [router, toast, clearAuthData])

    // Initialize auth: prefer sessionStorage (current tab), then localStorage (other tab had session; copy to session)
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedTokens = getStoredTokens()
                const storedUser = getStoredUser()
                // If we got from localStorage (new tab), copy to sessionStorage so this tab has the session
                if (storedTokens || storedUser) copyLocalAuthToSession()

                if (storedTokens && storedUser) {
                    // Set axios default header
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedTokens.access_token}`

                    // Verify token is still valid
                    try {
                        const response = await axios.get('/api/v1/auth/me')
                        const userData = response.data
                        setUser(userData)
                        setTokens(storedTokens)
                        persistUser(userData)
                        lastActivityAt.current = Date.now()

                        // Check if user must change password and redirect
                        if (userData.must_change_password && window.location.pathname !== '/change-password') {
                            router.push('/change-password')
                        }
                    } catch (error) {
                        // Token is invalid, try to refresh
                        try {
                            await refreshTokenFromStorage(storedTokens.refresh_token)
                        } catch (refreshError) {
                            // Refresh failed, clear storage
                            clearAuthData()
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                clearAuthData()
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [clearAuthData, router])

    // Auto-refresh token
    useEffect(() => {
        if (!tokens || !tokens.expires_in) return

        const refreshInterval = setInterval(() => {
            refreshToken()
        }, (tokens.expires_in - 300) * 1000) // Refresh 5 minutes before expiry

        return () => clearInterval(refreshInterval)
    }, [tokens])

    // Session warning timer: show dialog shortly before idle timeout
    useEffect(() => {
        if (!isAuthenticated || !idleTimeoutSeconds) return
        const checkInterval = setInterval(() => {
            const elapsed = (Date.now() - lastActivityAt.current) / 1000
            const warningAt = idleTimeoutSeconds - SESSION_WARNING_BEFORE_SECONDS
            if (elapsed >= warningAt && warningAt > 0) {
                setShowSessionWarning(true)
            }
        }, 30000) // Check every 30s
        return () => clearInterval(checkInterval)
    }, [isAuthenticated, idleTimeoutSeconds])

    // When user closes tab/window: clear localStorage so that when ALL tabs are closed, next visit has no tokens (logged out).
    // We do not call the logout API (would invalidate session for other open tabs). Session expires by idle/absolute timeout.
    useEffect(() => {
        const onPageUnload = () => clearLocalStorageAuth()
        window.addEventListener('beforeunload', onPageUnload)
        window.addEventListener('pagehide', onPageUnload)
        return () => {
            window.removeEventListener('beforeunload', onPageUnload)
            window.removeEventListener('pagehide', onPageUnload)
        }
    }, [])

    // Activity listeners: update lastActivity so warning doesn't show while user is active
    useEffect(() => {
        if (!isAuthenticated) return
        let throttle: ReturnType<typeof setTimeout> | null = null
        const updateActivity = () => {
            if (!throttle) {
                lastActivityAt.current = Date.now()
                throttle = setTimeout(() => { throttle = null }, 1000)
            }
        }
        window.addEventListener('mousemove', updateActivity)
        window.addEventListener('keydown', updateActivity)
        return () => {
            window.removeEventListener('mousemove', updateActivity)
            window.removeEventListener('keydown', updateActivity)
            if (throttle) clearTimeout(throttle)
        }
    }, [isAuthenticated])

    const refreshTokenFromStorage = async (refreshToken: string) => {
        const response = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken
        })

        const newTokens = response.data
        setTokens(newTokens)
        persistTokens(newTokens)

        // Update axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`

        // Get updated user info
        const userResponse = await axios.get('/api/v1/auth/me')
        const userData = userResponse.data
        setUser(userData)
        persistUser(userData)
    }

    // Auth methods
    const login = async (username: string, password: string) => {
        try {
            setIsLoading(true)

            const formData = new FormData()
            formData.append('username', username)
            formData.append('password', password)

            const response = await axios.post('/api/v1/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })

            const newTokens = response.data
            setTokens(newTokens)
            persistTokens(newTokens)

            // Set axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`

            // Get user info
            const userResponse = await axios.get('/api/v1/auth/me')
            const userData = userResponse.data
            setUser(userData)
            persistUser(userData)
            lastActivityAt.current = Date.now()

            toast({
                title: "Welcome back!",
                description: `Hello ${userData.username}`,
            })

            // Check if user must change password
            if (userData.must_change_password) {
                toast({
                    title: "Password Change Required",
                    description: "You must change your password before continuing.",
                    variant: "destructive",
                })
                router.push('/change-password')
                return
            }

            router.push('/dashboard')

        } catch (error: any) {
            const message = error.response?.data?.detail || 'Login failed'
            toast({
                title: "Login failed",
                description: message,
                variant: "destructive",
            })
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (userData: RegisterData) => {
        try {
            setIsLoading(true)

            const response = await axios.post<{ tokens: AuthTokens; user: User }>('/api/v1/auth/register', userData)

            const newTokens = response.data.tokens
            setTokens(newTokens)
            persistTokens(newTokens)

            // Set axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`

            // Set user info
            const registeredUser = response.data.user
            setUser(registeredUser)
            persistUser(registeredUser)

            toast({
                title: "Welcome to XploitRUM!",
                description: "Your account has been created successfully.",
            })

        } catch (error: any) {
            const message = error.response?.data?.detail || 'Registration failed'
            toast({
                title: "Registration failed",
                description: message,
                variant: "destructive",
            })
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = useCallback(() => {
        const token = tokens?.access_token
        if (token) {
            axios.post('/api/v1/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
        }
        clearAuthData()
        router.push('/')
        toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
        })
    }, [tokens?.access_token, clearAuthData, router, toast])

    const extendSession = useCallback(async () => {
        try {
            await axios.post('/api/v1/auth/session/extend')
            lastActivityAt.current = Date.now()
            setShowSessionWarning(false)
            toast({
                title: "Session extended",
                description: "You will stay logged in.",
            })
        } catch {
            clearAuthData()
            router.push('/login')
        }
    }, [clearAuthData, router, toast])

    const refreshToken = async () => {
        if (!tokens?.refresh_token) return

        try {
            await refreshTokenFromStorage(tokens.refresh_token)
        } catch (error) {
            console.error('Token refresh failed:', error)
            clearAuthData()
            router.push('/login')
        }
    }

    const updateProfile = async (profileData: Partial<User>) => {
        try {
            const response = await axios.put('/api/v1/auth/me', profileData)
            const updatedUser = response.data

            setUser(updatedUser)
            persistUser(updatedUser)

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            })

        } catch (error: any) {
            const message = error.response?.data?.detail || 'Profile update failed'
            toast({
                title: "Update failed",
                description: message,
                variant: "destructive",
            })
            throw error
        }
    }

    const changePassword = async (oldPassword: string, newPassword: string) => {
        try {
            await axios.post('/api/v1/auth/change-password', {
                old_password: oldPassword,
                new_password: newPassword
            })

            toast({
                title: "Password changed",
                description: "Your password has been changed successfully.",
            })

        } catch (error: any) {
            const message = error.response?.data?.detail || 'Password change failed'
            toast({
                title: "Password change failed",
                description: message,
                variant: "destructive",
            })
            throw error
        }
    }

    const value: AuthContextType = {
        user,
        tokens,
        isLoading,
        isAuthenticated,
        showSessionWarning,
        login,
        register,
        logout,
        refreshToken,
        extendSession,
        updateProfile,
        changePassword,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
            {showSessionWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-gray-900 border border-cyber-500 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Session expiring soon</h3>
                        <p className="text-gray-300 mb-4">
                            You will be logged out due to inactivity in a couple of minutes. Click below to stay logged in.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={extendSession}
                                className="flex-1 px-4 py-2 bg-cyber-500 hover:bg-cyber-400 text-white font-medium rounded transition"
                            >
                                Stay logged in
                            </button>
                            <button
                                onClick={() => { setShowSessionWarning(false); logout() }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    )
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Protected route component
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return <>{children}</>
}

// Admin route component
export function AdminRoute({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/')
        }
    }, [isAuthenticated, isLoading, user, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
            </div>
        )
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        return null
    }

    return <>{children}</>
}
