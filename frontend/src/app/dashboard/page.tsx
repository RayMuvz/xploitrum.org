'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Users,
    Trophy,
    Calendar,
    Settings,
    Lock,
    Unlock,
    FileText,
    Activity,
    TrendingUp,
    UserCheck,
    Shield,
    Flag,
    User,
    Award,
    Target,
    ChevronRight,
} from 'lucide-react'
import { ProtectedRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { getStoredToken, getAuthHeaders } from '@/lib/auth'

type SubmissionEntry = {
    id: number
    challenge_id: number
    challenge_title: string
    status: string
    points_awarded: number
    submitted_at: string
}

type UserStats = {
    total_score: number
    total_solves: number
    total_attempts?: number
    solve_rate: number
    rank?: number
    challenges_by_category?: Record<string, number>
    challenges_by_difficulty?: Record<string, number>
}

function UserDashboardContent() {
    const { user, tokens } = useAuth()
    const router = useRouter()
    const authHeaders = getAuthHeaders(tokens?.access_token ?? getStoredToken())
    const [stats, setStats] = useState<UserStats | null>(null)
    const [solves, setSolves] = useState<SubmissionEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, subsRes] = await Promise.all([
                    fetch('/api/v1/ctf/stats', { headers: authHeaders }),
                    fetch('/api/v1/submissions?limit=10', { headers: authHeaders }),
                ])
                if (statsRes.ok) {
                    const data = await statsRes.json()
                    setStats(data)
                }
                if (subsRes.ok) {
                    const data = await subsRes.json()
                    setSolves(data.filter((s: SubmissionEntry) => s.status === 'correct'))
                }
            } catch (e) {
                console.error('Failed to load dashboard data:', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [tokens?.access_token])

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-card rounded w-1/3" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 cyber-border rounded-lg bg-card/50" />
                        ))}
                    </div>
                    <div className="h-48 cyber-border rounded-lg bg-card/50" />
                </div>
            </div>
        )
    }

    const score = stats?.total_score ?? user?.score ?? 0
    const totalSolves = stats?.total_solves ?? user?.total_solves ?? 0
    const solveRate = stats?.solve_rate ?? 0

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
                <div className="cyber-border p-6 rounded-lg bg-card/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Score</p>
                            <p className="text-2xl font-bold text-cyber-400">{score}</p>
                        </div>
                        <Trophy className="h-10 w-10 text-cyber-400" />
                    </div>
                </div>
                <div className="cyber-border p-6 rounded-lg bg-card/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Challenges Solved</p>
                            <p className="text-2xl font-bold text-cyber-400">{totalSolves}</p>
                        </div>
                        <Flag className="h-10 w-10 text-cyber-400" />
                    </div>
                </div>
                <div className="cyber-border p-6 rounded-lg bg-card/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Solve Rate</p>
                            <p className="text-2xl font-bold text-cyber-400">{solveRate}%</p>
                        </div>
                        <Target className="h-10 w-10 text-cyber-400" />
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
            >
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                        href="/profile"
                        className="cyber-border rounded-lg p-4 bg-card/50 hover:border-cyber-400/50 hover:bg-cyber-400/5 transition-all flex items-center gap-4 group"
                    >
                        <div className="p-2 rounded-lg bg-cyber-400/10 group-hover:bg-cyber-400/20">
                            <User className="h-6 w-6 text-cyber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white">Edit Profile</p>
                            <p className="text-sm text-gray-400">Update your name, email, and preferences</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyber-400" />
                    </Link>
                    <Link
                        href="/ctf"
                        className="cyber-border rounded-lg p-4 bg-card/50 hover:border-cyber-400/50 hover:bg-cyber-400/5 transition-all flex items-center gap-4 group"
                    >
                        <div className="p-2 rounded-lg bg-cyber-400/10 group-hover:bg-cyber-400/20">
                            <Flag className="h-6 w-6 text-cyber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white">CTF Challenges</p>
                            <p className="text-sm text-gray-400">Solve challenges and capture flags</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyber-400" />
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="cyber-border rounded-lg p-4 bg-card/50 hover:border-cyber-400/50 hover:bg-cyber-400/5 transition-all flex items-center gap-4 group"
                    >
                        <div className="p-2 rounded-lg bg-cyber-400/10 group-hover:bg-cyber-400/20">
                            <Award className="h-6 w-6 text-cyber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-white">Scoreboard</p>
                            <p className="text-sm text-gray-400">View rankings and leaderboard</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyber-400" />
                    </Link>
                </div>
            </motion.div>

            {/* Recent Solves */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="cyber-border rounded-lg p-6 bg-card/50"
            >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Trophy className="h-5 w-5 text-cyber-400 mr-2" />
                    Recent CTF Solves
                </h2>
                {solves.length === 0 ? (
                    <p className="text-gray-400 py-4">
                        No solves yet. Head to the <Link href="/ctf" className="text-cyber-400 hover:underline">CTF page</Link> to start.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {solves.map((s) => (
                            <li
                                key={s.id}
                                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                            >
                                <span className="text-white font-medium">{s.challenge_title}</span>
                                <span className="text-cyber-400">+{s.points_awarded} pts</span>
                            </li>
                        ))}
                    </ul>
                )}
                {solves.length > 0 && (
                    <Link
                        href="/ctf"
                        className="inline-flex items-center mt-4 text-cyber-400 hover:text-cyber-300 text-sm font-medium"
                    >
                        View all challenges <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                )}
            </motion.div>
        </div>
    )
}

function AdminDashboardContent() {
    const { user, tokens } = useAuth()
    const router = useRouter()
    const authHeaders = getAuthHeaders(tokens?.access_token ?? getStoredToken())
    const [registrationOpen, setRegistrationOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [stats, setStats] = useState({
        total_members: 0,
        total_challenges: 0,
        total_events: 0,
        total_flags: 0,
        active_instances: 0,
    })

    useEffect(() => {
        fetchRegistrationStatus()
        fetchStats()
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/v1/stats/platform', { headers: authHeaders })
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        }
    }

    const fetchRegistrationStatus = async () => {
        try {
            const response = await fetch('/api/v1/admin/settings/registration', { headers: authHeaders })
            if (response.ok) {
                const data = await response.json()
                setRegistrationOpen(data.enabled)
            } else {
                const status = localStorage.getItem('xploitrum_registration_open')
                setRegistrationOpen(status === 'true')
            }
        } catch {
            const status = localStorage.getItem('xploitrum_registration_open')
            setRegistrationOpen(status === 'true')
        }
    }

    const toggleRegistration = async () => {
        setIsUpdating(true)
        try {
            const response = await fetch('/api/v1/admin/settings/registration', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ enabled: !registrationOpen }),
            })
            if (response.ok) {
                const data = await response.json()
                setRegistrationOpen(data.enabled)
                localStorage.setItem('xploitrum_registration_open', data.enabled.toString())
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to update' }))
                throw new Error(errorData.detail || 'Failed to update')
            }
        } catch (error) {
            console.error('Error updating registration:', error)
            alert('Failed to update registration status. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
            >
                <h2 className="text-2xl font-bold text-white mb-2">Welcome, {user?.username}</h2>
                <p className="text-gray-400">Manage content, users, challenges, and platform settings</p>
            </motion.div>

            {/* Quick Actions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                    onClick={() => router.push('/admin/events')}
                >
                    <Calendar className="h-12 w-12 text-cyber-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Events</h3>
                    <p className="text-gray-400 mb-4">Create, edit, and manage organization events</p>
                    <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">Manage Events</Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                    onClick={() => router.push('/admin/member-requests')}
                >
                    <UserCheck className="h-12 w-12 text-cyber-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Member Requests</h3>
                    <p className="text-gray-400 mb-4">Review and approve member account requests</p>
                    <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">View Requests</Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                    onClick={() => router.push('/admin/user-management')}
                >
                    <Shield className="h-12 w-12 text-cyber-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
                    <p className="text-gray-400 mb-4">Manage users, roles, and permissions</p>
                    <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">Manage Users</Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                    onClick={() => router.push('/admin/stats')}
                >
                    <TrendingUp className="h-12 w-12 text-cyber-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Statistics</h3>
                    <p className="text-gray-400 mb-4">Manage platform statistics</p>
                    <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">View Stats</Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                    className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                    onClick={() => router.push('/admin/pico-challenges')}
                >
                    <Flag className="h-12 w-12 text-cyber-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">picoCTF Challenges</h3>
                    <p className="text-gray-400 mb-4">Add and manage picoCTF challenge cards</p>
                    <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">Manage Challenges</Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="cyber-border rounded-lg p-6"
                >
                    <Settings className="h-12 w-12 text-cyber-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Registration</h3>
                    <p className="text-gray-400 mb-4">
                        {registrationOpen ? 'Registration is currently open' : 'Registration is currently closed'}
                    </p>
                    <Button
                        onClick={toggleRegistration}
                        disabled={isUpdating}
                        className={`w-full ${registrationOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {registrationOpen ? (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Close Registration
                            </>
                        ) : (
                            <>
                                <Unlock className="mr-2 h-4 w-4" />
                                Open Registration
                            </>
                        )}
                    </Button>
                </motion.div>
            </div>

            {/* Platform Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="cyber-border rounded-lg p-6 mb-8"
            >
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                    <Activity className="mr-2 h-6 w-6 text-cyber-400" />
                    Platform Overview
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <Users className="h-8 w-8 text-cyber-400 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white mb-1">{stats.total_members}</p>
                        <p className="text-gray-400 text-sm">Total Users</p>
                    </div>
                    <div className="text-center">
                        <Calendar className="h-8 w-8 text-cyber-400 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white mb-1">{stats.total_events}</p>
                        <p className="text-gray-400 text-sm">Upcoming Events</p>
                    </div>
                    <div className="text-center">
                        <TrendingUp className="h-8 w-8 text-cyber-400 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-white mb-1">{stats.total_members}</p>
                        <p className="text-gray-400 text-sm">Active Members</p>
                    </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-6">
                    <span className="inline-block h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    Live stats • Auto-updates every 30 seconds
                </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="cyber-border rounded-lg p-6"
            >
                <h3 className="text-2xl font-semibold text-white mb-4">Quick Links</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <a
                        href="/register"
                        className="flex items-center p-4 bg-card hover:bg-cyber-400/10 border border-border hover:border-cyber-400/50 rounded-lg transition-all"
                    >
                        <FileText className="h-5 w-5 text-cyber-400 mr-3" />
                        <span className="text-white">View Registration Page</span>
                    </a>
                    <a
                        href="/events"
                        className="flex items-center p-4 bg-card hover:bg-cyber-400/10 border border-border hover:border-cyber-400/50 rounded-lg transition-all"
                    >
                        <Calendar className="h-5 w-5 text-cyber-400 mr-3" />
                        <span className="text-white">View Events Page</span>
                    </a>
                    <a
                        href="/"
                        className="flex items-center p-4 bg-card hover:bg-cyber-400/10 border border-border hover:border-cyber-400/50 rounded-lg transition-all"
                    >
                        <Activity className="h-5 w-5 text-cyber-400 mr-3" />
                        <span className="text-white">View Main Website</span>
                    </a>
                </div>
            </motion.div>
        </div>
    )
}

export default function DashboardPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background pt-16">
                <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                {isAdmin ? (
                                    <>Admin <span className="text-cyber-400">Dashboard</span></>
                                ) : (
                                    <>Welcome back, <span className="text-cyber-400">{user?.username}</span></>
                                )}
                            </h1>
                            <p className="text-xl text-gray-400">
                                {isAdmin ? 'Manage XploitRUM platform' : 'Manage your account and explore XploitRUM'}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {isAdmin ? <AdminDashboardContent /> : <UserDashboardContent />}
            </div>
        </ProtectedRoute>
    )
}
