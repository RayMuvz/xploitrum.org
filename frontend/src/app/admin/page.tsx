'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
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
    Flag
} from 'lucide-react'
import { AdminRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { getStoredToken, getAuthHeaders } from '@/lib/auth'

export default function AdminDashboardPage() {
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
        active_instances: 0
    })

    useEffect(() => {
        fetchRegistrationStatus()
        fetchStats()
        // Auto-refresh stats every 30 seconds
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
            const response = await fetch('/api/v1/admin/settings/registration', {
                headers: authHeaders,
            })
            if (response.ok) {
                const data = await response.json()
                setRegistrationOpen(data.enabled)
            } else {
                console.error('Failed to fetch registration status:', response.status)
                // Fallback to localStorage
                const status = localStorage.getItem('xploitrum_registration_open')
                setRegistrationOpen(status === 'true')
            }
        } catch (error) {
            console.error('Error fetching registration status:', error)
            // Fallback to localStorage
            const status = localStorage.getItem('xploitrum_registration_open')
            setRegistrationOpen(status === 'true')
        }
    }

    const toggleRegistration = async () => {
        setIsUpdating(true)
        try {
            const response = await fetch('/api/v1/admin/settings/registration', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ enabled: !registrationOpen }),
            })

            if (response.ok) {
                const data = await response.json()
                setRegistrationOpen(data.enabled)
                // Also update localStorage as fallback
                localStorage.setItem('xploitrum_registration_open', data.enabled.toString())
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to update registration status' }))
                console.error('Failed to update registration status:', errorData)
                throw new Error(errorData.detail || 'Failed to update registration status')
            }
        } catch (error) {
            console.error('Error updating registration status:', error)
            // Show error but don't update state on failure
            alert('Failed to update registration status. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background pt-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Admin <span className="text-cyber-400">Dashboard</span>
                            </h1>
                            <p className="text-xl text-gray-400">
                                Manage XploitRUM platform
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Welcome, {user?.username}
                        </h2>
                        <p className="text-gray-400">
                            Manage content, users, challenges, and platform settings
                        </p>
                    </motion.div>

                    {/* Quick Actions Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Events Management */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                            onClick={() => router.push('/admin/events')}
                        >
                            <Calendar className="h-12 w-12 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Events</h3>
                            <p className="text-gray-400 mb-4">
                                Create, edit, and manage organization events
                            </p>
                            <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">
                                Manage Events
                            </Button>
                        </motion.div>

                        {/* Member Requests */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                            onClick={() => router.push('/admin/member-requests')}
                        >
                            <UserCheck className="h-12 w-12 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Member Requests</h3>
                            <p className="text-gray-400 mb-4">
                                Review and approve member account requests
                            </p>
                            <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">
                                View Requests
                            </Button>
                        </motion.div>

                        {/* User Management */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                            onClick={() => router.push('/admin/user-management')}
                        >
                            <Shield className="h-12 w-12 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
                            <p className="text-gray-400 mb-4">
                                Manage users, roles, and permissions
                            </p>
                            <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">
                                Manage Users
                            </Button>
                        </motion.div>

                        {/* Statistics Management */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                            onClick={() => router.push('/admin/stats')}
                        >
                            <TrendingUp className="h-12 w-12 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Statistics</h3>
                            <p className="text-gray-400 mb-4">
                                Manage platform statistics
                            </p>
                            <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">
                                View Stats
                            </Button>
                        </motion.div>

                        {/* picoCTF Challenges */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.55 }}
                            className="cyber-border rounded-lg p-6 hover:border-cyber-400/50 cursor-pointer transition-all"
                            onClick={() => router.push('/admin/pico-challenges')}
                        >
                            <Flag className="h-12 w-12 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">picoCTF Challenges</h3>
                            <p className="text-gray-400 mb-4">
                                Add and manage picoCTF challenge cards (category, difficulty)
                            </p>
                            <Button className="w-full bg-cyber-400 text-black hover:bg-cyber-500">
                                Manage Challenges
                            </Button>
                        </motion.div>

                        {/* Registration Settings */}
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
                            <span className="inline-block h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
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
            </div>
        </AdminRoute>
    )
}

