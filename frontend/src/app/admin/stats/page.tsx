'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, TrendingDown, Save, RefreshCw } from 'lucide-react'
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'

interface PlatformStats {
    total_members: number
    total_events: number
    total_challenges: number
    total_flags: number
    active_instances: number
    recent_solves: number
}

export default function AdminStatsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [customCount, setCustomCount] = useState(37)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/v1/stats/platform')
            if (response.data) {
                setStats(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateCustomCount = async () => {
        try {
            setIsSaving(true)
            // In a real implementation, this would update a database record
            // For now, we'll just persist to localStorage
            localStorage.setItem('custom_member_count', customCount.toString())
            toast({
                title: "Stats updated",
                description: `Active members count set to ${customCount}`
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update stats",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        const storedCount = localStorage.getItem('custom_member_count')
        if (storedCount) {
            setCustomCount(parseInt(storedCount, 10))
        }
    }, [])

    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background pt-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                    Platform <span className="text-cyber-400">Statistics</span>
                                </h1>
                                <p className="text-xl text-gray-400">
                                    Manage and customize platform statistics
                                </p>
                            </div>
                            <Button
                                onClick={fetchStats}
                                variant="outline"
                                className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Custom Member Count Configuration */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="cyber-border p-8 rounded-lg bg-card/50 mb-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="h-6 w-6 text-cyber-400" />
                            <h2 className="text-2xl font-bold text-white">Custom Member Count</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Active Members
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={customCount}
                                        onChange={(e) => setCustomCount(parseInt(e.target.value) || 0)}
                                        className="flex-1 px-4 py-2 bg-background border border-cyber-400 rounded text-white"
                                        min="0"
                                    />
                                    <Button
                                        onClick={() => setCustomCount(Math.max(0, customCount - 1))}
                                        variant="outline"
                                        className="border-gray-600"
                                    >
                                        <TrendingDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => setCustomCount(customCount + 1)}
                                        variant="outline"
                                        className="border-gray-600"
                                    >
                                        <TrendingUp className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="bg-background p-4 rounded border border-cyber-400/20">
                                    <p className="text-4xl font-bold text-cyber-400 mb-2">{customCount}+</p>
                                    <p className="text-gray-400">This is the number displayed on the homepage</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleUpdateCustomCount}
                            disabled={isSaving}
                            className="mt-6 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </motion.div>

                    {/* Statistics Grid */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Users className="h-8 w-8 text-cyber-400" />
                                    <span className="text-4xl font-bold text-white">{stats.total_members}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Total Members</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="h-8 w-8 text-cyber-400" />
                                    <span className="text-4xl font-bold text-white">{stats.total_events}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Total Events</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="h-8 w-8 text-cyber-400" />
                                    <span className="text-4xl font-bold text-white">{stats.total_challenges || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Total Challenges</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="h-8 w-8 text-cyber-400" />
                                    <span className="text-4xl font-bold text-white">{stats.total_flags || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Flags Captured</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="h-8 w-8 text-cyber-400" />
                                    <span className="text-4xl font-bold text-white">{stats.active_instances || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Active Instances</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <TrendingUp className="h-8 w-8 text-cyber-400" />
                                    <span className="text-4xl font-bold text-white">{stats.recent_solves || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Recent Solves (24h)</p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}

