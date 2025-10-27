'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
}

interface AuthTokens {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
}

interface AuthContextType {
    user: User | null
    tokens: AuthTokens | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<void>
    register: (userData: RegisterData) => Promise<void>
    logout: () => void
    refreshToken: () => Promise<void>
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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [tokens, setTokens] = useState<AuthTokens | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const { toast } = useToast()

    const isAuthenticated = !!user && !!tokens

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedTokens = localStorage.getItem('auth_tokens')
                const storedUser = localStorage.getItem('user')

                if (storedTokens && storedUser) {
                    const parsedTokens = JSON.parse(storedTokens)
                    const parsedUser = JSON.parse(storedUser)

                    // Set axios default header
                    axios.defaults.headers.common['Authorization'] = `Bearer ${parsedTokens.access_token}`

                    // Verify token is still valid
                    try {
                        const response = await axios.get('/api/v1/auth/me')
                        const userData = response.data
                        setUser(userData)
                        setTokens(parsedTokens)

                        // Check if user must change password and redirect
                        if (userData.must_change_password && window.location.pathname !== '/change-password') {
                            router.push('/change-password')
                        }
                    } catch (error) {
                        // Token is invalid, try to refresh
                        try {
                            await refreshTokenFromStorage(parsedTokens.refresh_token)
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
    }, [])

    // Auto-refresh token
    useEffect(() => {
        if (!tokens || !tokens.expires_in) return

        const refreshInterval = setInterval(() => {
            refreshToken()
        }, (tokens.expires_in - 300) * 1000) // Refresh 5 minutes before expiry

        return () => clearInterval(refreshInterval)
    }, [tokens])

    // Helper functions
    const clearAuthData = () => {
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
        setTokens(null)
    }

    const refreshTokenFromStorage = async (refreshToken: string) => {
        const response = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken
        })

        const newTokens = response.data
        setTokens(newTokens)
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

        // Update axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`

        // Get updated user info
        const userResponse = await axios.get('/api/v1/auth/me')
        setUser(userResponse.data)
        localStorage.setItem('user', JSON.stringify(userResponse.data))
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
            localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

            // Set axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`

            // Get user info
            const userResponse = await axios.get('/api/v1/auth/me')
            const userData = userResponse.data
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))

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

            const response = await axios.post('/api/v1/auth/register', userData)

            const newTokens = response.data.tokens
            setTokens(newTokens)
            localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

            // Set axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.access_token}`

            // Set user info
            setUser(response.data.user)
            localStorage.setItem('user', JSON.stringify(response.data.user))

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

    const logout = () => {
        clearAuthData()
        router.push('/')
        toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
        })
    }

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
            localStorage.setItem('user', JSON.stringify(updatedUser))

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
        login,
        register,
        logout,
        refreshToken,
        updateProfile,
        changePassword,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
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
