'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Trophy, Target, Shield, Edit2, Save, X, Lock } from 'lucide-react'
import { ProtectedRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'

interface UserStats {
    total_score: number
    total_solves: number
    total_attempts: number
    rank: number
    solve_rate: number
}

export default function ProfilePage() {
    const { user, updateProfile, isAuthenticated } = useAuth()
    const { toast } = useToast()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [editedName, setEditedName] = useState(user?.full_name || '')
    const [editedEmail, setEditedEmail] = useState(user?.email || '')

    useEffect(() => {
        if (user) {
            setEditedName(user.full_name || '')
            setEditedEmail(user.email || '')
            fetchUserStats()
        }
    }, [user])

    const fetchUserStats = async () => {
        try {
            const response = await axios.get('/api/v1/ctf/stats')
            if (response.data) {
                setStats(response.data)
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            console.log('Starting profile update...')
            
            // Update user info via API
            const response = await axios.put('/api/v1/auth/me', {
                full_name: editedName,
                email: editedEmail
            })

            console.log('Profile update response:', response.data)

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully."
            })
            setIsEditing(false)
            
            // Small delay before reload to show the toast
            setTimeout(() => {
                window.location.reload()
            }, 500)
        } catch (error: any) {
            console.error('Profile update error details:', {
                error,
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            })
            toast({
                title: "Error",
                description: error.response?.data?.detail || error.message || "Failed to update profile",
                variant: "destructive"
            })
        }
    }

    const handleCancel = () => {
        setEditedName(user?.full_name || '')
        setEditedEmail(user?.email || '')
        setIsEditing(false)
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
                            className="flex items-center justify-between"
                        >
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                    My <span className="text-cyber-400">Profile</span>
                                </h1>
                                <p className="text-xl text-gray-400">
                                    Manage your account settings and view your statistics
                                </p>
                            </div>
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="border-gray-600"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="cyber-border p-8 rounded-lg bg-card/50 mb-8"
                    >
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyber-400 to-neon-green flex items-center justify-center">
                                <User className="h-12 w-12 text-black" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-3xl font-bold text-white">{user?.username}</h2>
                                    {user?.role === 'admin' && (
                                        <span className="px-3 py-1 bg-cyber-400 text-black text-sm font-semibold rounded">
                                            Admin
                                        </span>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <User className="h-5 w-5 text-cyber-400" />
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-background border border-cyber-400 rounded text-white"
                                            />
                                        ) : (
                                            <span>{user?.full_name || 'Not set'}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Mail className="h-5 w-5 text-cyber-400" />
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={editedEmail}
                                                onChange={(e) => setEditedEmail(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-background border border-cyber-400 rounded text-white"
                                            />
                                        ) : (
                                            <span>{user?.email}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Calendar className="h-5 w-5 text-cyber-400" />
                                        <span>Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <Shield className="h-5 w-5 text-cyber-400" />
                                        <span>Role: {user?.role || 'User'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Statistics Grid */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Trophy className="h-8 w-8 text-cyber-400" />
                                    <span className="text-3xl font-bold text-white">{stats.total_score || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Total Score</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Target className="h-8 w-8 text-cyber-400" />
                                    <span className="text-3xl font-bold text-white">{stats.total_solves || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Challenges Solved</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Target className="h-8 w-8 text-cyber-400" />
                                    <span className="text-3xl font-bold text-white">#{stats.rank || 0}</span>
                                </div>
                                <p className="text-gray-400 font-medium">Rank</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="cyber-border p-6 rounded-lg bg-card/30"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Target className="h-8 w-8 text-cyber-400" />
                                    <span className="text-3xl font-bold text-white">{Math.round(stats.solve_rate || 0)}%</span>
                                </div>
                                <p className="text-gray-400 font-medium">Success Rate</p>
                            </motion.div>
                        </div>
                    )}

                    {/* Change Password Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="cyber-border p-8 rounded-lg bg-card/50"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="h-6 w-6 text-cyber-400" />
                            <h2 className="text-2xl font-bold text-white">Security</h2>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Password</h3>
                                <p className="text-gray-400">Update your password to keep your account secure</p>
                            </div>
                            <Button
                                onClick={() => window.location.href = '/change-password'}
                                variant="outline"
                                className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                            >
                                Change Password
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </ProtectedRoute>
    )
}

