'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface PlatformStats {
    total_challenges: number
    total_members: number
    total_events: number
    total_flags: number
}

export function StatsSection() {
    const [stats, setStats] = useState<PlatformStats>({
        total_challenges: 0,
        total_members: 0,
        total_events: 0,
        total_flags: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchStats()
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/stats/platform`)

            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const displayStats = [
        { label: 'Active Members', value: stats.total_members },
        { label: 'CTF Challenges', value: stats.total_challenges },
        { label: 'Upcoming Events', value: stats.total_events },
    ]

    return (
        <section className="py-16 bg-card/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
                    {displayStats.map((stat, index) => (
                        <motion.div
                            key={index}
                            className="text-center w-full"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <div className="text-4xl md:text-5xl font-bold text-cyber-400 mb-2">
                                {isLoading ? '...' : `${stat.value}${stat.value > 0 ? '+' : ''}`}
                            </div>
                            <div className="text-gray-400 font-medium">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
