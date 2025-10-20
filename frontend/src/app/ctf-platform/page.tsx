'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Play,
    Square,
    Flag,
    Clock,
    Users,
    Trophy,
    Filter,
    Search,
    Zap,
    Shield,
    Lock,
    CheckCircle,
    XCircle,
    LogIn,
    Plus,
    Download,
    Monitor,
    Globe,
    Copy,
    ExternalLink
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
    status: string
}

interface Instance {
    id: number
    challenge_title: string
    challenge_category: string
    status: string
    started_at: string
    expires_at?: string
    container_name: string
    ports?: Record<string, string>
    ip_address?: string
    status_details?: string
}

const CATEGORIES = ['all', 'web', 'crypto', 'pwn', 'reverse', 'forensics', 'osint', 'misc']
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard', 'expert']

export default function CTFPlatformPage() {
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()
    const router = useRouter()

    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [instances, setInstances] = useState<Instance[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedDifficulty, setSelectedDifficulty] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
    const [flagSubmission, setFlagSubmission] = useState('')
    const [activeTab, setActiveTab] = useState<'challenges' | 'instances'>('challenges')

    useEffect(() => {
        fetchChallenges()
        fetchInstances()

        // Auto-refresh challenges and instances every 30 seconds for real-time updates
        const interval = setInterval(() => {
            fetchChallenges()
            fetchInstances()
        }, 30000)

        return () => clearInterval(interval)
    }, [isAuthenticated, selectedCategory, selectedDifficulty])

    const fetchChallenges = async () => {
        try {
            const params = new URLSearchParams()
            if (selectedCategory !== 'all') params.append('category', selectedCategory)
            if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty)

            const headers: any = {}
            if (isAuthenticated) {
                const authTokens = localStorage.getItem('auth_tokens')
                if (authTokens) {
                    headers['Authorization'] = `Bearer ${JSON.parse(authTokens).access_token}`
                }
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const url = `${apiUrl}/api/v1/challenges/?${params}`
            console.log('Fetching challenges from:', url)
            console.log('Headers:', headers)

            const response = await fetch(url, { headers })
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

    const fetchInstances = async () => {
        try {
            if (isAuthenticated) {
                // Fetch from API for authenticated users
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                const response = await fetch(`${apiUrl}/api/v1/ctf/instances`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setInstances(data)
                }
            } else {
                // Load from localStorage for anonymous users
                const storedInstances = localStorage.getItem('anonymous_instances')
                if (storedInstances) {
                    const parsedInstances = JSON.parse(storedInstances)
                    // Filter out expired instances
                    const activeInstances = parsedInstances.filter((inst: Instance) => {
                        if (inst.expires_at) {
                            return new Date(inst.expires_at) > new Date()
                        }
                        return true
                    })
                    setInstances(activeInstances)
                    // Update localStorage to remove expired ones
                    localStorage.setItem('anonymous_instances', JSON.stringify(activeInstances))
                }
            }
        } catch (error) {
            console.error('Failed to fetch instances:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const deployChallenge = async (challengeId: number) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/ctf/challenges/${challengeId}/deploy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                const data = await response.json()

                // For anonymous users, save instance to localStorage
                if (!isAuthenticated) {
                    const challenge = challenges.find(c => c.id === challengeId)
                    const newInstance: Instance = {
                        id: data.instance_id || Date.now(),
                        challenge_title: challenge?.title || data.challenge_info?.title || 'Unknown',
                        challenge_category: challenge?.category || data.challenge_info?.category || 'misc',
                        status: 'running',
                        started_at: new Date().toISOString(),
                        expires_at: data.expires_at,
                        container_name: data.container_name,
                        ports: data.ports,
                        ip_address: data.ip_address
                    }

                    const storedInstances = localStorage.getItem('anonymous_instances')
                    const instances = storedInstances ? JSON.parse(storedInstances) : []
                    instances.push(newInstance)
                    localStorage.setItem('anonymous_instances', JSON.stringify(instances))
                }

                toast({
                    title: "Instance Deployed!",
                    description: `Challenge instance is starting up. Check your instances tab.`,
                })
                fetchInstances()
                fetchChallenges()

                // Auto-switch to instances tab to show the deployed instance
                setActiveTab('instances')
            } else {
                const error = await response.json()
                toast({
                    title: "Deployment Failed",
                    description: error.detail || "Failed to deploy challenge instance",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Deployment Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const stopInstance = async (instanceId: number) => {
        try {
            if (!isAuthenticated) {
                // For anonymous users, just remove from localStorage
                const storedInstances = localStorage.getItem('anonymous_instances')
                if (storedInstances) {
                    const instances = JSON.parse(storedInstances)
                    const filteredInstances = instances.filter((inst: Instance) => inst.id !== instanceId)
                    localStorage.setItem('anonymous_instances', JSON.stringify(filteredInstances))

                    toast({
                        title: "Instance Stopped",
                        description: "Challenge instance has been stopped.",
                    })
                    fetchInstances()
                    fetchChallenges()
                }
                return
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/ctf/instances/${instanceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                toast({
                    title: "Instance Stopped",
                    description: "Challenge instance has been stopped successfully.",
                })
                fetchInstances()
                fetchChallenges()
            }
        } catch (error) {
            toast({
                title: "Failed to Stop Instance",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const submitFlag = async (challengeId: number, flag: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/ctf/challenges/${challengeId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({ flag })
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: data.correct ? "Flag Correct! 🎉" : "Incorrect Flag",
                    description: data.message,
                    variant: data.correct ? "default" : "destructive",
                })

                if (data.correct) {
                    setFlagSubmission('')
                    setSelectedChallenge(null)
                    fetchChallenges()
                }
            }
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const downloadOpenVPN = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/vpn/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'xploitrum.ovpn'
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                toast({
                    title: "OpenVPN Config Downloaded",
                    description: "Use this file with your OpenVPN client to connect",
                })
            } else {
                toast({
                    title: "Download Failed",
                    description: "Failed to download OpenVPN configuration",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Download Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard`,
        })
    }

    const filteredChallenges = challenges.filter(challenge => {
        const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory
        const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty
        const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            challenge.description.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesCategory && matchesDifficulty && matchesSearch
    })

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

    const formatTimeRemaining = (expiresAt: string) => {
        const now = new Date()
        const expiry = new Date(expiresAt)
        const diff = expiry.getTime() - now.getTime()

        if (diff <= 0) return 'Expired'

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        return `${hours}h ${minutes}m`
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
                    >
                        <div className="text-center mb-6">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                CTF <span className="text-cyber-400">Platform</span>
                            </h1>
                            <p className="text-xl text-gray-400">
                                Hack your way to the top of the leaderboard
                            </p>
                        </div>

                        {/* Admin Controls */}
                        {isAuthenticated && user?.role === 'admin' && (
                            <div className="flex justify-center">
                                <Button
                                    onClick={() => router.push('/admin/challenges')}
                                    className="bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Manage CTF Machines
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('challenges')}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === 'challenges'
                            ? 'text-cyber-400 border-b-2 border-cyber-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Shield className="h-5 w-5 inline mr-2" />
                        Challenges
                    </button>
                    <button
                        onClick={() => setActiveTab('instances')}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === 'instances'
                            ? 'text-cyber-400 border-b-2 border-cyber-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Monitor className="h-5 w-5 inline mr-2" />
                        My Instances {instances.length > 0 && `(${instances.length})`}
                    </button>
                </div>

                {/* Challenges Tab */}
                {activeTab === 'challenges' && (
                    <>

                        {/* Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="cyber-border p-6 rounded-lg bg-card/50 mb-8"
                        >
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">Filters:</span>
                                </div>

                                {/* Category Filter */}
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-background border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                    ))}
                                </select>

                                {/* Difficulty Filter */}
                                <select
                                    value={selectedDifficulty}
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                    className="bg-background border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                >
                                    {DIFFICULTIES.map(diff => (
                                        <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                                    ))}
                                </select>

                                {/* Search */}
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search challenges..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-gray-600 rounded text-white text-sm placeholder-gray-500"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Challenges Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {challenges.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-gray-400">No challenges available</p>
                                </div>
                            ) : (
                                <>
                                    <div className="col-span-full text-center mb-4">
                                        <p className="text-gray-400 text-sm">Showing {filteredChallenges.length} of {challenges.length} challenges</p>
                                    </div>
                                    {filteredChallenges.map((challenge) => (
                                        <div key={challenge.id} className="cyber-border p-6 rounded-lg bg-card/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-2xl">{getCategoryIcon(challenge.category)}</span>
                                                <div className="flex items-center gap-2">
                                                    {challenge.status === 'INACTIVE' || challenge.status === 'inactive' ? (
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">
                                                            INACTIVE
                                                        </span>
                                                    ) : null}
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                                        {challenge.difficulty}
                                                    </span>
                                                    {challenge.is_solved && <CheckCircle className="h-5 w-5 text-green-400" />}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-white mb-2">{challenge.title}</h3>
                                            <p className="text-gray-400 text-sm mb-4 line-clamp-3">{challenge.description}</p>

                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-cyber-400 font-semibold">{challenge.points} pts</span>
                                                <span className="text-gray-500 text-sm">
                                                    {challenge.total_solves} solves
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                {challenge.status === 'INACTIVE' || challenge.status === 'inactive' ? (
                                                    <div className="text-center">
                                                        <Button
                                                            disabled
                                                            className="w-full bg-gray-600 text-gray-400 cursor-not-allowed"
                                                        >
                                                            <Lock className="h-4 w-4 mr-2" />
                                                            Challenge Inactive
                                                        </Button>
                                                        <p className="text-xs text-gray-500 mt-2">This challenge is currently unavailable</p>
                                                    </div>
                                                ) : challenge.is_solved ? (
                                                    <div className="text-center py-2 text-green-400 font-semibold">
                                                        ✓ Challenge Solved!
                                                    </div>
                                                ) : challenge.has_active_instance ? (
                                                    <Button
                                                        onClick={() => setSelectedChallenge(challenge)}
                                                        variant="outline"
                                                        className="w-full border-neon-green text-neon-green hover:bg-neon-green hover:text-black"
                                                    >
                                                        <Flag className="h-4 w-4 mr-2" />
                                                        Submit Flag
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => deployChallenge(challenge.id)}
                                                        className="w-full bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                                    >
                                                        <Play className="h-4 w-4 mr-2" />
                                                        Deploy Instance
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </motion.div>
                    </>
                )}

                {/* Instances Tab */}
                {activeTab === 'instances' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* OpenVPN Connection Section */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50 mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <Globe className="h-6 w-6 mr-2 text-cyber-400" />
                                OpenVPN Connection
                            </h2>
                            <p className="text-gray-400 mb-4">
                                Download your OpenVPN configuration file to connect to the CTF network and access your instances.
                            </p>
                            <Button
                                onClick={downloadOpenVPN}
                                className="bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download OpenVPN Config
                            </Button>
                            <p className="text-sm text-gray-500 mt-4">
                                After downloading, connect using: <code className="bg-gray-800 px-2 py-1 rounded">sudo openvpn xploitrum.ovpn</code>
                            </p>
                        </div>

                        {/* Active Instances */}
                        <div className="cyber-border p-6 rounded-lg bg-card/50">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <Monitor className="h-6 w-6 mr-2 text-cyber-400" />
                                Active Instances
                            </h2>

                            {instances.length === 0 ? (
                                <div className="text-center py-12">
                                    <Monitor className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                                    <p className="text-gray-400 text-lg mb-2">No active instances</p>
                                    <p className="text-gray-500">Deploy a challenge to get started</p>
                                    <Button
                                        onClick={() => setActiveTab('challenges')}
                                        className="mt-4 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                    >
                                        Browse Challenges
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {instances.map((instance) => (
                                        <div key={instance.id} className="cyber-border p-6 rounded-lg bg-background/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold text-white">{instance.challenge_title}</h3>
                                                <span className={`px-3 py-1 rounded text-sm font-semibold ${instance.status === 'running'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {instance.status}
                                                </span>
                                            </div>

                                            <p className="text-gray-400 text-sm mb-4">
                                                <span className="text-cyber-400">Category:</span> {instance.challenge_category}
                                            </p>

                                            {instance.expires_at && (
                                                <div className="flex items-center text-sm text-gray-400 mb-4 bg-gray-800/50 px-3 py-2 rounded">
                                                    <Clock className="h-4 w-4 mr-2 text-cyber-400" />
                                                    <span className="font-semibold">{formatTimeRemaining(instance.expires_at)}</span> remaining
                                                </div>
                                            )}

                                            {/* Connection Details */}
                                            <div className="space-y-3 mb-4">
                                                {instance.ip_address && (
                                                    <div className="bg-gray-800/50 p-3 rounded">
                                                        <p className="text-xs text-gray-500 mb-1">Target IP</p>
                                                        <div className="flex items-center justify-between">
                                                            <code className="text-cyber-400 font-mono">{instance.ip_address}</code>
                                                            <button
                                                                onClick={() => copyToClipboard(instance.ip_address!, 'IP Address')}
                                                                className="text-gray-400 hover:text-cyber-400 transition-colors"
                                                            >
                                                                <Copy className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {instance.ports && Object.keys(instance.ports).length > 0 && (
                                                    <div className="bg-gray-800/50 p-3 rounded">
                                                        <p className="text-xs text-gray-500 mb-2">Available Ports</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(instance.ports).map(([internal, external]) => (
                                                                <div
                                                                    key={internal}
                                                                    className="bg-cyber-400/20 text-cyber-400 px-3 py-1 rounded text-sm font-mono"
                                                                >
                                                                    {internal}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-gray-800/50 p-3 rounded">
                                                    <p className="text-xs text-gray-500 mb-1">Container Name</p>
                                                    <code className="text-gray-300 font-mono text-sm">{instance.container_name}</code>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="space-y-2">
                                                <Button
                                                    onClick={() => router.push(`/machine/${instance.id}`)}
                                                    className="w-full bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500"
                                                >
                                                    <Monitor className="h-4 w-4 mr-2" />
                                                    Access Machine
                                                </Button>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => {
                                                            setActiveTab('challenges')
                                                            // Find and select the challenge to submit flag
                                                            const challenge = challenges.find(c => c.title === instance.challenge_title)
                                                            if (challenge) setSelectedChallenge(challenge)
                                                        }}
                                                        variant="outline"
                                                        className="flex-1 border-cyber-400 text-cyber-400"
                                                    >
                                                        <Flag className="h-4 w-4 mr-2" />
                                                        Submit Flag
                                                    </Button>
                                                    <Button
                                                        onClick={() => stopInstance(instance.id)}
                                                        variant="outline"
                                                        className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                                                    >
                                                        <Square className="h-4 w-4 mr-2" />
                                                        Stop
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Flag Submission Modal */}
            {selectedChallenge && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="cyber-border p-6 rounded-lg bg-card max-w-md w-full"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">
                            Submit Flag for {selectedChallenge.title}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Flag
                            </label>
                            <input
                                type="text"
                                value={flagSubmission}
                                onChange={(e) => setFlagSubmission(e.target.value)}
                                placeholder="Enter the flag..."
                                className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => submitFlag(selectedChallenge.id, flagSubmission)}
                                className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                            >
                                <Flag className="h-4 w-4 mr-2" />
                                Submit Flag
                            </Button>
                            <Button
                                onClick={() => {
                                    setSelectedChallenge(null)
                                    setFlagSubmission('')
                                }}
                                variant="outline"
                                className="border-gray-600 text-gray-400"
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
