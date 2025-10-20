'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Plus,
    Play,
    Pause,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    Save,
    X,
    Upload,
    Container
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Challenge {
    id: number
    title: string
    description: string
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
    docker_image?: string
    status: string
}

interface ChallengeFormData {
    title: string
    description: string
    category: string
    difficulty: string
    points: string
    flag: string
    author: string
    docker_image: string
    docker_ports: string
    docker_environment: string
    docker_volumes: string
    max_instances: string
    instance_timeout: string
    max_solves: string
    tags: string
    hints: string
}

export default function AdminChallengesPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
    const [formData, setFormData] = useState<ChallengeFormData>({
        title: '',
        description: '',
        category: 'web',
        difficulty: 'easy',
        points: '100',
        flag: '',
        author: '',
        docker_image: '',
        docker_ports: '',
        docker_environment: '',
        docker_volumes: '',
        max_instances: '10',
        instance_timeout: '3600',
        max_solves: '',
        tags: '',
        hints: ''
    })

    useEffect(() => {
        fetchChallenges()
        // Auto-refresh challenges every 30 seconds for real-time updates
        const interval = setInterval(fetchChallenges, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchChallenges = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            console.log('Fetching challenges from:', `${apiUrl}/api/v1/challenges/`)

            const response = await fetch(`${apiUrl}/api/v1/challenges/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            console.log('Response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('Fetched challenges:', data)
                setChallenges(data)
            } else {
                console.error('Failed to fetch challenges, status:', response.status)
            }
        } catch (error) {
            console.error('Failed to fetch challenges:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateChallenge = async () => {
        try {
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            console.log('Creating challenge with token:', token ? 'Present' : 'Missing')
            console.log('Request URL:', '/api/challenges/')
            console.log('Form data:', formData)

            // Use the environment variable for the API URL
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/challenges/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    points: parseInt(formData.points),
                    max_instances: parseInt(formData.max_instances),
                    instance_timeout: parseInt(formData.instance_timeout),
                    max_solves: formData.max_solves ? parseInt(formData.max_solves) : null,
                    docker_ports: formData.docker_ports ? JSON.parse(formData.docker_ports) : null,
                    docker_environment: formData.docker_environment ? JSON.parse(formData.docker_environment) : null,
                    docker_volumes: formData.docker_volumes ? JSON.parse(formData.docker_volumes) : null,
                    tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
                    hints: formData.hints ? JSON.parse(formData.hints) : null
                })
            })

            console.log('Response status:', response.status)
            console.log('Response headers:', Object.fromEntries(response.headers.entries()))

            if (response.ok) {
                const data = await response.json()
                console.log('Created challenge:', data)
                toast({
                    title: "Challenge Created",
                    description: "Challenge has been created successfully",
                })
                setShowCreateForm(false)
                resetForm()
                fetchChallenges()
            } else {
                const error = await response.json()
                console.error('Creation error:', error)
                toast({
                    title: "Creation Failed",
                    description: error.detail || "Failed to create challenge",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Network error:', error)
            toast({
                title: "Creation Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const handleUpdateChallenge = async () => {
        if (!editingChallenge) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/challenges/${editingChallenge.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({
                    ...formData,
                    points: parseInt(formData.points),
                    max_instances: parseInt(formData.max_instances),
                    instance_timeout: parseInt(formData.instance_timeout),
                    max_solves: formData.max_solves ? parseInt(formData.max_solves) : null,
                    docker_ports: formData.docker_ports ? JSON.parse(formData.docker_ports) : null,
                    docker_environment: formData.docker_environment ? JSON.parse(formData.docker_environment) : null,
                    docker_volumes: formData.docker_volumes ? JSON.parse(formData.docker_volumes) : null,
                    tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
                    hints: formData.hints ? JSON.parse(formData.hints) : null
                })
            })

            if (response.ok) {
                toast({
                    title: "Challenge Updated",
                    description: "Challenge has been updated successfully",
                })
                setEditingChallenge(null)
                resetForm()
                fetchChallenges()
            } else {
                const error = await response.json()
                toast({
                    title: "Update Failed",
                    description: error.detail || "Failed to update challenge",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const handleDeleteChallenge = async (challengeId: number) => {
        if (!confirm('Are you sure you want to delete this challenge?')) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/challenges/${challengeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                toast({
                    title: "Challenge Deleted",
                    description: "Challenge has been deleted successfully",
                })
                fetchChallenges()
            } else {
                const error = await response.json()
                toast({
                    title: "Deletion Failed",
                    description: error.detail || "Failed to delete challenge",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Deletion Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const handleToggleStatus = async (challengeId: number, currentStatus: string) => {
        const isActive = currentStatus?.toUpperCase() === 'ACTIVE'
        const newStatus = isActive ? 'INACTIVE' : 'ACTIVE'

        console.log('Toggling status:', { challengeId, currentStatus, isActive, newStatus })

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/challenges/${challengeId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({ status: newStatus })
            })

            console.log('Toggle response status:', response.status)

            if (response.ok) {
                toast({
                    title: `Challenge ${newStatus === 'ACTIVE' ? 'Activated' : 'Deactivated'}`,
                    description: `Challenge has been ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
                })
                fetchChallenges()
            } else {
                const error = await response.json()
                console.error('Toggle error:', error)
                toast({
                    title: "Status Update Failed",
                    description: error.detail || "Failed to update challenge status",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Toggle exception:', error)
            toast({
                title: "Status Update Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: 'web',
            difficulty: 'easy',
            points: '100',
            flag: '',
            author: user?.username || '',
            docker_image: '',
            docker_ports: '',
            docker_environment: '',
            docker_volumes: '',
            max_instances: '10',
            instance_timeout: '3600',
            max_solves: '',
            tags: '',
            hints: ''
        })
    }

    const startEdit = (challenge: Challenge) => {
        setEditingChallenge(challenge)
        setFormData({
            title: challenge.title,
            description: challenge.description,
            category: challenge.category,
            difficulty: challenge.difficulty,
            points: challenge.points.toString(),
            flag: '', // Don't show the actual flag
            author: challenge.author,
            docker_image: challenge.docker_image || '',
            docker_ports: '',
            docker_environment: '',
            docker_volumes: '',
            max_instances: '10',
            instance_timeout: '3600',
            max_solves: '',
            tags: '',
            hints: ''
        })
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return 'text-green-400 bg-green-400/20'
            case 'medium': return 'text-yellow-400 bg-yellow-400/20'
            case 'hard': return 'text-red-400 bg-red-400/20'
            case 'expert': return 'text-purple-400 bg-purple-400/20'
            default: return 'text-gray-400 bg-gray-400/20'
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
            </div>
        )
    }

    return (
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
                                Challenge <span className="text-cyber-400">Management</span>
                            </h1>
                            <p className="text-xl text-gray-400">
                                Create and manage CTF challenges with Docker integration
                            </p>
                        </div>

                        <Button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Challenge
                        </Button>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Challenges Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {challenges.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-400">No challenges available</p>
                        </div>
                    ) : (
                        <>
                            <div className="col-span-full text-center mb-4">
                                <p className="text-gray-400 text-sm">Found {challenges.length} challenges</p>
                            </div>
                            {challenges.map((challenge) => (
                                <div key={challenge.id} className="cyber-border p-6 rounded-lg bg-card/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                                {challenge.difficulty}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(challenge.id, challenge.status)}
                                                className={`p-2 transition-colors ${(challenge.status === 'ACTIVE' || challenge.status === 'active')
                                                    ? 'text-green-400 hover:text-green-300'
                                                    : 'text-gray-400 hover:text-yellow-400'
                                                    }`}
                                                title={(challenge.status === 'ACTIVE' || challenge.status === 'active') ? 'Deactivate Challenge' : 'Activate Challenge'}
                                            >
                                                {(challenge.status === 'ACTIVE' || challenge.status === 'active') ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            </button>
                                            <button onClick={() => startEdit(challenge)} className="p-2 text-gray-400 hover:text-cyber-400 transition-colors">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDeleteChallenge(challenge.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{challenge.description}</p>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Status:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${(challenge.status === 'ACTIVE' || challenge.status === 'active')
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {challenge.status?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Points:</span>
                                            <span className="text-cyber-400 font-semibold">{challenge.points}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Solves:</span>
                                            <span className="text-neon-green font-semibold">{challenge.total_solves}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Author:</span>
                                            <span className="text-gray-400">{challenge.author}</span>
                                        </div>
                                    </div>

                                    {challenge.docker_image && (
                                        <div className="flex items-center text-sm text-gray-500 mb-4">
                                            <Container className="h-4 w-4 mr-1" />
                                            Docker: {challenge.docker_image}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black px-3 py-2 rounded text-sm font-semibold hover:from-cyber-500 hover:to-neon-green/80 transition-all">
                                            <Play className="h-4 w-4 mr-1 inline" />
                                            Test
                                        </button>
                                        <button className="border border-cyber-400 text-cyber-400 px-3 py-2 rounded text-sm font-semibold hover:bg-cyber-400 hover:text-black transition-all">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )
                    }
                </motion.div >
            </div >

            {/* Create/Edit Challenge Modal */}
            {
                (showCreateForm || editingChallenge) && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="cyber-border p-6 rounded-lg bg-card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        setEditingChallenge(null)
                                        resetForm()
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Challenge Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="Enter challenge title"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="Enter challenge description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                    >
                                        <option value="web">Web</option>
                                        <option value="crypto">Crypto</option>
                                        <option value="pwn">Pwn</option>
                                        <option value="reverse">Reverse</option>
                                        <option value="forensics">Forensics</option>
                                        <option value="osint">OSINT</option>
                                        <option value="misc">Misc</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Points
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="Your username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Flag
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.flag}
                                        onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="xploitrum{flag_here}"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Docker Image
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.docker_image}
                                        onChange={(e) => setFormData({ ...formData, docker_image: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="ubuntu:20.04"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Max Instances
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max_instances}
                                        onChange={(e) => setFormData({ ...formData, max_instances: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Instance Timeout (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.instance_timeout}
                                        onChange={(e) => setFormData({ ...formData, instance_timeout: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="3600"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Docker Ports (JSON)
                                    </label>
                                    <textarea
                                        value={formData.docker_ports}
                                        onChange={(e) => setFormData({ ...formData, docker_ports: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder='{"80": "8080", "22": "2222"}'
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="web, sql, injection"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={editingChallenge ? handleUpdateChallenge : handleCreateChallenge}
                                    className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingChallenge ? 'Update Challenge' : 'Create Challenge'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        setEditingChallenge(null)
                                        resetForm()
                                    }}
                                    variant="outline"
                                    className="border-gray-600 text-gray-400"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </div>
    )
}
