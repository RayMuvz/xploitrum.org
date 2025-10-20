'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Play, Pause, Server, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AdminRoute } from '@/components/admin-route'

interface Machine {
    id: number
    name: string
    description: string
    os: string
    difficulty: string
    ip_address: string
    status: string
    points: number
    docker_image: string
}

export default function AdminMachinesPage() {
    const router = useRouter()
    const { toast } = useToast()
    
    const [machines, setMachines] = useState<Machine[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        os: 'Linux',
        difficulty: 'easy',
        points: '20',
        docker_image: '',
        flag: ''
    })

    useEffect(() => {
        fetchMachines()
    }, [])

    const fetchMachines = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

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

    const handleCreateMachine = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({
                    ...formData,
                    points: parseInt(formData.points)
                })
            })

            if (response.ok) {
                toast({
                    title: "Machine Created",
                    description: "Machine has been created successfully"
                })
                setShowCreateForm(false)
                resetForm()
                fetchMachines()
            } else {
                const error = await response.json()
                toast({
                    title: "Creation Failed",
                    description: error.detail || "Failed to create machine",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Network error occurred",
                variant: "destructive"
            })
        }
    }

    const handleDeleteMachine = async (machineId: number) => {
        if (!confirm('Are you sure you want to delete this machine?')) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines/${machineId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                toast({
                    title: "Machine Deleted",
                    description: "Machine has been deleted"
                })
                fetchMachines()
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete machine",
                variant: "destructive"
            })
        }
    }

    const toggleMachineStatus = async (machine: Machine) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const newStatus = machine.status === 'active' ? 'inactive' : 'active'
            
            const response = await fetch(`${apiUrl}/api/v1/machines/${machine.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                toast({
                    title: "Status Updated",
                    description: `Machine is now ${newStatus}`
                })
                fetchMachines()
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive"
            })
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            os: 'Linux',
            difficulty: 'easy',
            points: '20',
            docker_image: '',
            flag: ''
        })
        setEditingMachine(null)
    }

    const machineTemplates = {
        dvwa: {
            name: 'DVWA',
            description: 'Damn Vulnerable Web Application - Practice web security vulnerabilities',
            os: 'Linux',
            difficulty: 'easy',
            points: '20',
            docker_image: 'vulnerables/web-dvwa',
            flag: 'flag{dvwa_master}'
        }
    }

    const loadTemplate = (template: keyof typeof machineTemplates) => {
        setFormData(machineTemplates[template])
        setShowCreateForm(true)
    }

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background pt-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">Manage Machines</h1>
                                <p className="text-xl text-gray-400">Create and manage HTB-style vulnerable machines</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => loadTemplate('dvwa')}
                                    variant="outline"
                                    className="border-purple-400 text-purple-400"
                                >
                                    Quick: DVWA
                                </Button>
                                <Button
                                    onClick={() => setShowCreateForm(true)}
                                    className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Machine
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Machines Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {machines.map((machine) => (
                            <motion.div
                                key={machine.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="cyber-border rounded-lg bg-card p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Server className="h-8 w-8 text-cyber-400" />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleMachineStatus(machine)}
                                            className={`p-2 rounded ${
                                                machine.status === 'active'
                                                    ? 'text-green-400 hover:bg-green-400/10'
                                                    : 'text-gray-400 hover:bg-gray-400/10'
                                            }`}
                                        >
                                            {machine.status === 'active' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMachine(machine.id)}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{machine.name}</h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{machine.description}</p>

                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-400">{machine.os}</span>
                                    <span className="text-cyber-400">{machine.difficulty}</span>
                                    <span className="text-gray-400">{machine.points} pts</span>
                                </div>

                                <div className="mt-3 bg-background rounded p-2">
                                    <p className="text-xs text-gray-500">IP</p>
                                    <p className="text-cyber-400 font-mono text-sm">{machine.ip_address}</p>
                                </div>
                            </motion.div>
                        ))}

                        {machines.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-400">No machines created yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create/Edit Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="cyber-border p-6 rounded-lg bg-card max-w-2xl w-full"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Create Machine</h2>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        resetForm()
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Machine Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        placeholder="e.g., DVWA, Lame, Legacy"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        rows={3}
                                        placeholder="Machine description and objectives"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">OS</label>
                                        <select
                                            value={formData.os}
                                            onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        >
                                            <option>Linux</option>
                                            <option>Windows</option>
                                            <option>Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                            <option value="insane">Insane</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                                    <input
                                        type="number"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        placeholder="20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Docker Image</label>
                                    <input
                                        type="text"
                                        value={formData.docker_image}
                                        onChange={(e) => setFormData({ ...formData, docker_image: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        placeholder="vulnerables/web-dvwa"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Flag</label>
                                    <input
                                        type="text"
                                        value={formData.flag}
                                        onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                        placeholder="flag{machine_owned}"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleCreateMachine}
                                        className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Create Machine
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowCreateForm(false)
                                            resetForm()
                                        }}
                                        variant="outline"
                                        className="border-gray-600"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminRoute>
    )
}

