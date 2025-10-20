'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    Terminal as TerminalIcon,
    Monitor,
    Maximize2,
    Minimize2,
    Power,
    Wifi,
    Clock,
    Copy,
    ExternalLink,
    Flag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

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
}

export default function MachinePage({ params }: { params: { id: string } }) {
    const instanceId = parseInt(params.id)
    const router = useRouter()
    const { toast } = useToast()
    
    const [instance, setInstance] = useState<Instance | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [terminalTab, setTerminalTab] = useState<'terminal' | 'browser'>('browser')

    useEffect(() => {
        loadInstance()
    }, [instanceId])

    const loadInstance = () => {
        // Load from localStorage for anonymous users
        const storedInstances = localStorage.getItem('anonymous_instances')
        if (storedInstances) {
            const instances = JSON.parse(storedInstances)
            const found = instances.find((inst: Instance) => inst.id === instanceId)
            if (found) {
                setInstance(found)
            }
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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast({
            title: "Copied!",
            description: `${label} copied to clipboard`,
        })
    }

    if (!instance) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Monitor className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Instance not found</p>
                    <Button
                        onClick={() => router.push('/ctf-platform')}
                        className="mt-4 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                    >
                        Back to CTF Platform
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.push('/ctf-platform')}
                            variant="outline"
                            size="sm"
                            className="border-cyber-400 text-cyber-400"
                        >
                            ← Back
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-cyber-400" />
                                {instance.challenge_title}
                            </h1>
                            <p className="text-sm text-gray-400">{instance.challenge_category}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {instance.expires_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded">
                                <Clock className="h-4 w-4 text-cyber-400" />
                                <span className="font-semibold">{formatTimeRemaining(instance.expires_at)}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <Wifi className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-semibold">Connected</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Info Bar */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
                <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        {instance.ip_address && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Target IP:</span>
                                <code className="text-cyber-400 font-mono bg-gray-800 px-2 py-1 rounded">
                                    {instance.ip_address}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(instance.ip_address!, 'IP Address')}
                                    className="text-gray-400 hover:text-cyber-400"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {instance.ports && Object.keys(instance.ports).length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Ports:</span>
                                <div className="flex gap-2">
                                    {Object.entries(instance.ports).map(([internal, external]) => (
                                        <span key={internal} className="text-cyber-400 font-mono bg-gray-800 px-2 py-1 rounded">
                                            {internal}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={() => router.push('/ctf-platform?tab=instances')}
                        size="sm"
                        variant="outline"
                        className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                    >
                        <Power className="h-4 w-4 mr-2" />
                        Stop Instance
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${isFullscreen ? 'fixed inset-0 z-50 pt-0' : 'max-w-7xl mx-auto px-4 py-4'}`}>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800" style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 200px)' }}>
                    {/* Tabs */}
                    <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTerminalTab('browser')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    terminalTab === 'browser'
                                        ? 'text-cyber-400 border-b-2 border-cyber-400'
                                        : 'text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                <Monitor className="h-4 w-4 inline mr-2" />
                                Web Browser
                            </button>
                            <button
                                onClick={() => setTerminalTab('terminal')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    terminalTab === 'terminal'
                                        ? 'text-cyber-400 border-b-2 border-cyber-400'
                                        : 'text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                <TerminalIcon className="h-4 w-4 inline mr-2" />
                                Terminal
                            </button>
                        </div>

                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="text-gray-400 hover:text-white p-2"
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="h-full bg-black">
                        {terminalTab === 'browser' ? (
                            <div className="h-full flex flex-col">
                                {/* Browser Address Bar */}
                                <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex-1 bg-gray-900 rounded px-3 py-1 flex items-center">
                                        <span className="text-gray-500 text-sm font-mono">
                                            http://{instance.ip_address}:80
                                        </span>
                                    </div>
                                    <Button
                                        onClick={() => window.open(`http://${instance.ip_address}`, '_blank')}
                                        size="sm"
                                        variant="outline"
                                        className="border-cyber-400 text-cyber-400"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Browser View */}
                                <div className="flex-1 flex items-center justify-center bg-gray-950">
                                    <div className="text-center">
                                        <Monitor className="h-24 w-24 mx-auto text-gray-700 mb-6" />
                                        <h3 className="text-xl text-white mb-2">Web View (Development Mode)</h3>
                                        <p className="text-gray-400 mb-4 max-w-md">
                                            In simulation mode, the web interface is not available.<br/>
                                            Click "Open in New Tab" to access the target when Docker is running.
                                        </p>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500">
                                                <strong>Target IP:</strong> <code className="text-cyber-400">{instance.ip_address}</code>
                                            </p>
                                            <Button
                                                onClick={() => window.open(`http://${instance.ip_address}`, '_blank')}
                                                className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Open in New Tab
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {/* Terminal View */}
                                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                                    <div className="text-green-400">
                                        <p>XploitRUM CTF Platform - Web Terminal</p>
                                        <p className="text-gray-500 mt-2">Connected to: {instance.challenge_title}</p>
                                        <p className="text-gray-500">Target IP: {instance.ip_address}</p>
                                        <p className="text-gray-500 mb-4">Container: {instance.container_name}</p>
                                        
                                        <p className="text-yellow-400 mt-4">⚠️ Terminal Access (Development Mode)</p>
                                        <p className="text-gray-400 mt-2">
                                            Interactive terminal is not available in simulation mode.
                                        </p>
                                        
                                        <p className="text-cyan-400 mt-4">Recommended Tools:</p>
                                        <p className="text-gray-300 mt-2">→ Use your local terminal to interact with the target</p>
                                        <p className="text-gray-400 ml-4">$ ping {instance.ip_address}</p>
                                        <p className="text-gray-400 ml-4">$ nmap -sV {instance.ip_address}</p>
                                        <p className="text-gray-400 ml-4">$ curl http://{instance.ip_address}</p>
                                        
                                        <p className="text-cyan-400 mt-4">With OpenVPN:</p>
                                        <p className="text-gray-400 ml-4">$ sudo openvpn xploitrum.ovpn</p>
                                        <p className="text-gray-400 ml-4 mt-2"># Then access the target directly</p>
                                        
                                        <div className="mt-6 p-4 bg-gray-900 rounded border border-cyber-400/30">
                                            <p className="text-white mb-2">💡 Quick Start:</p>
                                            <ol className="text-gray-400 space-y-1 ml-4">
                                                <li>1. Download the OpenVPN config from the Instances tab</li>
                                                <li>2. Connect: <code className="text-cyber-400">sudo openvpn xploitrum.ovpn</code></li>
                                                <li>3. Scan the target: <code className="text-cyber-400">nmap {instance.ip_address}</code></li>
                                                <li>4. Find vulnerabilities and capture the flag!</li>
                                            </ol>
                                        </div>
                                        
                                        <p className="text-green-400 mt-6 animate-pulse">root@kali:~# _</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

