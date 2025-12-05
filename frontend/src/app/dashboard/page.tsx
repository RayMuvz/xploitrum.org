'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { ProtectedRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
    const { user } = useAuth()

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
                                Manage your account and explore XploitRUM
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
                        {/* User Info */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50 col-span-1 md:col-span-2 lg:col-span-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Welcome to your dashboard</p>
                                    <p className="text-xl font-bold text-cyber-400">Manage your account and settings</p>
                                </div>
                                <Users className="h-8 w-8 text-cyber-400" />
                            </div>
                        </div>
                    </motion.div>


                </div>
            </div>
        </ProtectedRoute>
    )
}
