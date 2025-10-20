'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Play,
    Square,
    Flag,
    Clock,
    Monitor,
    Download,
    ExternalLink,
    Terminal as TerminalIcon,
    Server,
    Shield,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Machine {
    id: number
    name: string
    description: string
    os: string
    difficulty: 'easy' | 'medium' | 'hard' | 'insane'
    ip_address: string
    status: 'active' | 'inactive'
    user_owns: boolean
    points: number
}

interface ActiveMachine {
    id: number
    machine_id: number
    machine_name: string
    ip_address: string
    started_at: string
    expires_at: string
    time_remaining: number
}

export default function MachinesPage() {
    const router = useRouter()
    const { toast } = useToast()
    
    const [machines, setMachines] = useState<Machine[]>([])
    const [activeMachine, setActiveMachine] = useState<ActiveMachine | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeploying, setIsDeploying] = useState(false)

    useEffect(() => {
        fetchMachines()
        fetchActiveMachine()
        
        const interval = setInterval(() => {
            fetchMachines()
            fetchActiveMachine()
        }, 30000)
        
        return () => clearInterval(interval)
    }, [])

    const fetchMachines = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines`)
            
            if (response.ok) {
                const data = await response.json()
                setMachines(data)
            }
        } catch (error) {
            console.error('Failed to fetch machines:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchActiveMachine = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines/active`)
            
            if (response.ok) {
                const data = await response.json()
                setActiveMachine(data)
            } else {
                setActiveMachine(null)
            }
        } catch (error) {
            console.error('Failed to fetch active machine:', error)
            setActiveMachine(null)
        }
    }

    const startMachine = async (machineId: number) => {
        if (activeMachine) {
            toast({
                title: "Machine Already Running",
                description: `You already have "${activeMachine.machine_name}" running. Stop it first.`,
                variant: "destructive"
            })
            return
        }

        setIsDeploying(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines/${machineId}/start`, {
                method: 'POST'
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Machine Started!",
                    description: `${data.machine_name} is now running. IP: ${data.ip_address}`
                })
                fetchActiveMachine()
            } else {
                const error = await response.json()
                toast({
                    title: "Failed to Start",
                    description: error.detail || "Could not start machine",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Network error occurred",
                variant: "destructive"
            })
        } finally {
            setIsDeploying(false)
        }
    }

    const stopMachine = async () => {
        if (!activeMachine) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines/${activeMachine.id}/stop`, {
                method: 'POST'
            })

            if (response.ok) {
                toast({
                    title: "Machine Stopped",
                    description: "Machine has been stopped successfully"
                })
                setActiveMachine(null)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to stop machine",
                variant: "destructive"
            })
        }
    }

    const downloadVPN = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        window.open(`${apiUrl}/api/v1/vpn/download`, '_blank')
    }

    const openPwnbox = () => {
        if (activeMachine) {
            window.open(`/pwnbox?machine=${activeMachine.id}`, '_blank', 'width=1400,height=900')
        } else {
            toast({
                title: "No Active Machine",
                description: "Start a machine first to use Pwnbox",
                variant: "destructive"
            })
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-green-400'
            case 'medium': return 'text-yellow-400'
            case 'hard': return 'text-orange-400'
            case 'insane': return 'text-red-400'
            default: return 'text-gray-400'
        }
    }

    const formatTimeRemaining = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                            Hack The <span className="text-cyber-400">Box</span>
                        </h1>
                        <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto">
                            Practice your penetration testing skills on vulnerable machines
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Active Machine Banner */}
                {activeMachine && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cyber-border rounded-lg bg-gradient-to-r from-cyber-400/20 to-neon-green/20 p-6 mb-8"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Server className="h-8 w-8 text-cyber-400" />
                                <div>
                                    <h3 className="text-xl font-bold text-white">{activeMachine.machine_name}</h3>
                                    <p className="text-gray-400">
                                        IP: <span className="text-cyber-400 font-mono">{activeMachine.ip_address}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 bg-cyber-400/20 rounded">
                                    <Clock className="h-4 w-4 text-cyber-400" />
                                    <span className="text-cyber-400 font-mono">
                                        {formatTimeRemaining(activeMachine.time_remaining)}
                                    </span>
                                </div>
                                
                                <Button
                                    onClick={openPwnbox}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                >
                                    <Monitor className="h-4 w-4 mr-2" />
                                    Open Pwnbox
                                </Button>
                                
                                <Button
                                    onClick={downloadVPN}
                                    variant="outline"
                                    className="border-cyber-400 text-cyber-400"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    VPN
                                </Button>
                                
                                <Button
                                    onClick={stopMachine}
                                    variant="outline"
                                    className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                                >
                                    <Square className="h-4 w-4 mr-2" />
                                    Stop
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Machines Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {machines.map((machine, index) => (
                        <motion.div
                            key={machine.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="cyber-border rounded-lg bg-card p-6 hover:border-cyber-400/50 transition-all"
                        >
                            {/* Machine Icon */}
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${
                                    machine.os.toLowerCase().includes('linux') ? 'bg-green-500/20' :
                                    machine.os.toLowerCase().includes('windows') ? 'bg-blue-500/20' :
                                    'bg-gray-500/20'
                                }`}>
                                    <Server className={`h-8 w-8 ${
                                        machine.os.toLowerCase().includes('linux') ? 'text-green-400' :
                                        machine.os.toLowerCase().includes('windows') ? 'text-blue-400' :
                                        'text-gray-400'
                                    }`} />
                                </div>
                                {machine.user_owns && (
                                    <div className="flex items-center gap-1 text-cyber-400">
                                        <Flag className="h-4 w-4" />
                                        <span className="text-sm">Owned</span>
                                    </div>
                                )}
                            </div>

                            {/* Machine Info */}
                            <h3 className="text-xl font-bold text-white mb-2">{machine.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{machine.description}</p>

                            {/* Machine Details */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-2 py-1 rounded text-sm ${getDifficultyColor(machine.difficulty)} bg-current/10`}>
                                    {machine.difficulty}
                                </span>
                                <span className="text-gray-400 text-sm">{machine.os}</span>
                                <span className="text-gray-400 text-sm">{machine.points} pts</span>
                            </div>

                            {/* IP Address */}
                            <div className="bg-background rounded p-2 mb-4">
                                <p className="text-xs text-gray-500">Target IP</p>
                                <p className="text-cyber-400 font-mono">{machine.ip_address}</p>
                            </div>

                            {/* Actions */}
                            {activeMachine && activeMachine.machine_id === machine.id ? (
                                <div className="space-y-2">
                                    <Button
                                        onClick={openPwnbox}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                    >
                                        <Monitor className="h-4 w-4 mr-2" />
                                        Open Pwnbox
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={downloadVPN}
                                            variant="outline"
                                            className="flex-1 border-cyber-400 text-cyber-400"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            VPN
                                        </Button>
                                        <Button
                                            onClick={stopMachine}
                                            variant="outline"
                                            className="flex-1 border-red-400 text-red-400"
                                        >
                                            <Square className="h-4 w-4 mr-2" />
                                            Stop
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => startMachine(machine.id)}
                                    disabled={machine.status === 'inactive' || !!activeMachine || isDeploying}
                                    className="w-full bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500"
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    {isDeploying ? 'Starting...' : 'Start Machine'}
                                </Button>
                            )}
                        </motion.div>
                    ))}

                    {machines.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No machines available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

