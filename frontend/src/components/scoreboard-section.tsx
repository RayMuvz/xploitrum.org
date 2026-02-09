'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'
import Link from 'next/link'

interface ScoreboardEntry {
    rank: number
    username: string
    full_name?: string
    score: number
    total_solves: number
}

export function ScoreboardSection() {
    const [entries, setEntries] = useState<ScoreboardEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchScoreboard = async () => {
            try {
                const res = await fetch('/api/pico/scoreboard?limit=5')
                if (res.ok) {
                    const data = await res.json()
                    setEntries(data)
                }
            } catch (e) {
                console.error('Failed to fetch scoreboard', e)
            } finally {
                setLoading(false)
            }
        }
        fetchScoreboard()
    }, [])

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-5 w-5 text-yellow-400" />
            case 2: return <Medal className="h-5 w-5 text-gray-400" />
            case 3: return <Award className="h-5 w-5 text-orange-600" />
            default: return <span className="text-gray-500 font-semibold text-sm">#{rank}</span>
        }
    }

    return (
        <section className="py-16 bg-gradient-to-b from-cyber-900/30 to-background border-y border-cyber-400/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        <span className="text-cyber-400">picoCTF</span> Scoreboard
                    </h2>
                    <p className="text-gray-400">Top members by submitted flags</p>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyber-400" />
                    </div>
                ) : entries.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No scores yet. Be the first to submit a flag!</p>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-2xl mx-auto space-y-3 max-h-[400px] overflow-y-auto pr-2"
                    >
                        {entries.map((e, i) => (
                            <div
                                key={e.rank}
                                className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-cyber-400/20"
                            >
                                <div className="w-10 flex justify-center">{getRankIcon(e.rank)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white truncate">{e.username}</p>
                                    {e.full_name && <p className="text-sm text-gray-500 truncate">{e.full_name}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-cyber-400 font-bold">{e.score} pts</p>
                                    <p className="text-xs text-gray-500">{e.total_solves} solves</p>
                                </div>
                            </div>
                        ))}
                        <div className="text-center pt-4">
                            <Link
                                href="/leaderboard"
                                className="inline-block px-6 py-2 rounded border border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black transition-colors"
                            >
                                View full scoreboard
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    )
}
