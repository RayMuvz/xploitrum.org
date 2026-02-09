'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, TrendingUp, Users, Target } from 'lucide-react'
import { Footer } from '@/components/footer'

interface LeaderboardEntry {
    rank: number
    username: string
    full_name?: string
    score: number
    total_solves: number
    university?: string
    country?: string
    avatar_url?: string
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'month' | 'week'>('all')

    useEffect(() => {
        fetchLeaderboard()
        // Auto-refresh every 30 seconds for real-time updates
        const interval = setInterval(fetchLeaderboard, 30000)
        return () => clearInterval(interval)
    }, [filter])

    const fetchLeaderboard = async () => {
        try {
            // Use pico scoreboard (public); same User.score/total_solves updated by picoCTF submissions
            const response = await fetch('/api/pico/scoreboard?limit=100')
            
            if (response.ok) {
                const data = await response.json()
                setLeaderboard(data)
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-400" />
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />
            case 3:
                return <Award className="h-6 w-6 text-orange-600" />
            default:
                return <span className="text-gray-500 font-semibold">#{rank}</span>
        }
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50'
            case 2:
                return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50'
            case 3:
                return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/50'
            default:
                return 'bg-card/30 border-gray-700'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background pt-16">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            <span className="text-cyber-400">Leaderboard</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Top hackers competing for glory and recognition
                        </p>
                    </motion.div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="cyber-border p-6 rounded-lg bg-card/30 text-center"
                        >
                            <Users className="h-8 w-8 mx-auto text-cyber-400 mb-2" />
                            <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
                            <p className="text-gray-400">Active Hackers</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="cyber-border p-6 rounded-lg bg-card/30 text-center"
                        >
                            <Target className="h-8 w-8 mx-auto text-cyber-400 mb-2" />
                            <p className="text-3xl font-bold text-white">
                                {leaderboard.reduce((sum, entry) => sum + entry.total_solves, 0)}
                            </p>
                            <p className="text-gray-400">Total Solves</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="cyber-border p-6 rounded-lg bg-card/30 text-center"
                        >
                            <TrendingUp className="h-8 w-8 mx-auto text-cyber-400 mb-2" />
                            <p className="text-3xl font-bold text-white">
                                {leaderboard.length > 0
                                    ? `${leaderboard[0].username}: ${leaderboard[0].score}`
                                    : '—'}
                            </p>
                            <p className="text-gray-400">Top Score</p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {leaderboard.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-12"
                    >
                        <Trophy className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">No Rankings Yet</h3>
                        <p className="text-gray-400 mb-6">
                            Be the first to solve challenges and claim the top spot!
                        </p>
                        <a
                            href="/ctf-platform"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold rounded hover:from-cyber-500 transition-all"
                        >
                            Start Hacking
                        </a>
                    </motion.div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
                        {leaderboard.map((entry, index) => (
                            <motion.div
                                key={entry.rank}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className={`cyber-border p-6 rounded-lg ${getRankColor(entry.rank)} transition-all hover:scale-[1.02]`}
                            >
                                <div className="flex items-center gap-6">
                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-16 text-center">
                                        {getRankIcon(entry.rank)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyber-400 to-neon-green flex items-center justify-center text-black font-bold text-xl">
                                            {entry.username.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-white">{entry.username}</h3>
                                        {entry.full_name && (
                                            <p className="text-gray-400">{entry.full_name}</p>
                                        )}
                                        {(entry.university || entry.country) && (
                                            <p className="text-sm text-gray-500">
                                                {entry.university} {entry.university && entry.country && '•'} {entry.country}
                                            </p>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-3xl font-bold text-cyber-400">{entry.score}</p>
                                        <p className="text-sm text-gray-400">{entry.total_solves} solves</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}

