'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Trophy,
    Target,
    Clock,
    Users,
    TrendingUp,
    Award,
    Zap,
    Activity,
    BarChart3,
    Calendar
} from 'lucide-react'
import { ProtectedRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

interface UserStats {
    total_score: number
    total_solves: number
    total_attempts: number
    rank: number
    solve_rate: number
    challenges_by_category: Record<string, number>
    challenges_by_difficulty: Record<string, number>
}

interface Challenge {
    id: number
    title: string
    category: string
    difficulty: string
    points: number
    total_solves: number
    total_attempts: number
    solve_percentage: number
    is_solved: boolean
    has_active_instance: boolean
    author: string
    created_at: string
}

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuth()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData()
        }
    }, [isAuthenticated])

    const fetchDashboardData = async () => {
        try {
            // Fetch user stats
            const statsResponse = await fetch('/api/v1/ctf/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (statsResponse.ok) {
                const statsData = await statsResponse.json()
                setStats(statsData)
            }

            // Fetch challenges
            const challengesResponse = await fetch('/api/v1/ctf/challenges', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (challengesResponse.ok) {
                const challengesData = await challengesResponse.json()
                setChallenges(challengesData.slice(0, 6)) // Show only first 6 challenges
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-green-400'
            case 'medium': return 'text-yellow-400'
            case 'hard': return 'text-red-400'
            case 'expert': return 'text-purple-400'
            default: return 'text-gray-400'
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'web': return '🌐'
            case 'crypto': return '🔐'
            case 'pwn': return '💥'
            case 'reverse': return '🔄'
            case 'forensics': return '🔍'
            case 'osint': return '🕵️'
            case 'misc': return '🎲'
            default: return '📝'
        }
    }

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
                            className="text-center"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Welcome back, <span className="text-cyber-400">{user?.username}</span>
                            </h1>
                            <p className="text-xl text-gray-400">
                                Ready to hack the planet? 🌍
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                        {/* Total Score */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Total Score</p>
                                    <p className="text-3xl font-bold text-cyber-400">{stats?.total_score || 0}</p>
                                </div>
                                <Trophy className="h-8 w-8 text-cyber-400" />
                            </div>
                        </div>

                        {/* Total Solves */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Challenges Solved</p>
                                    <p className="text-3xl font-bold text-neon-green">{stats?.total_solves || 0}</p>
                                </div>
                                <Target className="h-8 w-8 text-neon-green" />
                            </div>
                        </div>

                        {/* Rank */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Current Rank</p>
                                    <p className="text-3xl font-bold text-yellow-400">#{stats?.rank || 'N/A'}</p>
                                </div>
                                <Award className="h-8 w-8 text-yellow-400" />
                            </div>
                        </div>

                        {/* Solve Rate */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Success Rate</p>
                                    <p className="text-3xl font-bold text-purple-400">{stats?.solve_rate || 0}%</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-purple-400" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Challenges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="cyber-border p-6 rounded-lg bg-card/50 mb-8"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <Zap className="h-6 w-6 mr-2 text-cyber-400" />
                                Recent Challenges
                            </h2>
                            <Button
                                variant="outline"
                                className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                            >
                                View All
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {challenges.map((challenge) => (
                                <div key={challenge.id} className="p-4 border border-gray-700 rounded-lg hover:border-cyber-400/50 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
                                        <span className={`text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                            {challenge.difficulty}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-1">{challenge.title}</h3>
                                    <p className="text-sm text-gray-400 mb-3">{challenge.category} • {challenge.points} pts</p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {challenge.total_solves} solves
                                        </span>
                                        {challenge.is_solved ? (
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                                ✓ Solved
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                                                Unsolved
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* CTF Platform */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <Activity className="h-8 w-8 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">CTF Platform</h3>
                            <p className="text-gray-400 mb-4">Access challenges and deploy instances</p>
                            <Button className="w-full bg-gradient-to-r from-cyber-400 to-neon-green text-black">
                                Launch CTF
                            </Button>
                        </div>

                        {/* Leaderboard */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <BarChart3 className="h-8 w-8 text-neon-green mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Leaderboard</h3>
                            <p className="text-gray-400 mb-4">Check your ranking and compete</p>
                            <Button variant="outline" className="w-full border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black">
                                View Rankings
                            </Button>
                        </div>

                        {/* Lab System */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <Calendar className="h-8 w-8 text-purple-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Lab System</h3>
                            <p className="text-gray-400 mb-4">Practice with isolated environments</p>
                            <Button variant="outline" className="w-full border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black">
                                Open Lab
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
