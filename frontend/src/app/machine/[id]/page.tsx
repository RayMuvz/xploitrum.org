'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Monitor,
    Terminal as TerminalIcon,
    X,
    Maximize2,
    Minimize2,
    RefreshCw,
    ExternalLink,
    Copy,
    Check,
    Flag,
    Square,
    Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Instance {
    id: number
    challenge_id: number
    challenge_title: string
    challenge_category: string
    status: string
    started_at: string
    expires_at?: string
    container_name: string
    ports?: Record<string, any>
    ip_address?: string
    instance_url?: string
    time_remaining?: number
}

export default function MachinePage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const instanceId = params.id as string

    const [instance, setInstance] = useState<Instance | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false)
    const [isTerminalFullscreen, setIsTerminalFullscreen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [browserUrl, setBrowserUrl] = useState('')
    const [terminalUrl, setTerminalUrl] = useState('')
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const terminalRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        fetchInstance()
        const interval = setInterval(fetchInstance, 10000) // Refresh every 10 seconds
        return () => clearInterval(interval)
    }, [instanceId])

    const fetchInstance = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/ctf/instances/${instanceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setInstance(data)
                
                // Set browser URL
                if (data.instance_url) {
                    setBrowserUrl(data.instance_url)
                } else if (data.ip_address && data.ports) {
                    // Construct URL from IP and ports
                    const httpPort = Object.values(data.ports).find((port: any) => 
                        port && (port.includes('80') || port.includes('8080'))
                    )
                    if (httpPort) {
                        setBrowserUrl(`http://${data.ip_address}`)
                    }
                }

                // Set terminal URL (WebSocket-based terminal)
                // For now, we'll use xterm.js with WebSocket connection
                setTerminalUrl(`${apiUrl}/api/v1/ctf/instances/${instanceId}/terminal`)
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch instance details",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Failed to fetch instance:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStopInstance = async () => {
        if (!confirm('Are you sure you want to stop this instance?')) return

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/ctf/instances/${instanceId}/stop`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                toast({
                    title: "Instance Stopped",
                    description: "Your instance has been stopped successfully"
                })
                router.push('/ctf-platform')
            } else {
                toast({
                    title: "Error",
                    description: "Failed to stop instance",
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
            title: "Copied!",
            description: "URL copied to clipboard"
        })
    }

    const refreshBrowser = () => {
        if (iframeRef.current) {
            iframeRef.current.src = iframeRef.current.src
        }
    }

    const openInNewTab = () => {
        if (browserUrl) {
            window.open(browserUrl, '_blank')
        }
    }

    const openFullInstance = () => {
        // Redirect to ctf.xploitrum.org subdomain for full instance view
        const ctfUrl = `https://ctf.xploitrum.org/machine/${instanceId}`
        window.open(ctfUrl, '_blank')
    }

    const formatTimeRemaining = (seconds?: number) => {
        if (!seconds) return 'Unknown'
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading instance...</p>
                </div>
            </div>
        )
    }

    if (!instance) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">Instance not found</p>
                    <Button onClick={() => router.push('/ctf-platform')}>
                        Back to CTF Platform
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-white">
            {/* Header */}
            <div className="border-b border-gray-800 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-full mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => router.push('/ctf-platform')}
                                variant="outline"
                                className="border-gray-600"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Close
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold">{instance.challenge_title}</h1>
                                <p className="text-sm text-gray-400">
                                    {instance.challenge_category} • {instance.status}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {instance.time_remaining && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-cyber-400/20 rounded text-cyber-400">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-mono">
                                        {formatTimeRemaining(instance.time_remaining)}
                                    </span>
                                </div>
                            )}
                            {typeof window !== 'undefined' && !window.location.hostname.includes('ctf.xploitrum.org') && (
                                <Button
                                    onClick={openFullInstance}
                                    variant="outline"
                                    className="border-purple-400 text-purple-400"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open in CTF View
                                </Button>
                            )}
                            <Button
                                onClick={() => router.push('/ctf-platform')}
                                variant="outline"
                                className="border-cyber-400 text-cyber-400"
                            >
                                <Flag className="h-4 w-4 mr-2" />
                                Submit Flag
                            </Button>
                            <Button
                                onClick={handleStopInstance}
                                variant="outline"
                                className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                            >
                                <Square className="h-4 w-4 mr-2" />
                                Stop Instance
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-4">
                {/* Browser Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`cyber-border rounded-lg bg-card overflow-hidden ${
                        isBrowserFullscreen ? 'fixed inset-4 z-50' : ''
                    }`}
                >
                    {/* Browser Header */}
                    <div className="bg-card/50 border-b border-gray-800 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <Monitor className="h-5 w-5 text-cyber-400" />
                            <div className="flex-1 bg-background rounded px-3 py-2 text-sm font-mono text-gray-400 flex items-center gap-2">
                                <span className="flex-1 truncate">{browserUrl || 'No URL available'}</span>
                                {browserUrl && (
                                    <button
                                        onClick={() => copyToClipboard(browserUrl)}
                                        className="text-cyber-400 hover:text-cyber-300"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={refreshBrowser}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={openInNewTab}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => setIsBrowserFullscreen(!isBrowserFullscreen)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                {isBrowserFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Browser Content */}
                    <div className={isBrowserFullscreen ? 'h-[calc(100vh-180px)]' : 'h-[500px]'}>
                        {browserUrl ? (
                            <iframe
                                ref={iframeRef}
                                src={browserUrl}
                                className="w-full h-full bg-white"
                                title="Challenge Browser"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-background">
                                <div className="text-center">
                                    <Monitor className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">No web interface available</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        This challenge may not have a web interface
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Terminal Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`cyber-border rounded-lg bg-card overflow-hidden ${
                        isTerminalFullscreen ? 'fixed inset-4 z-50' : ''
                    }`}
                >
                    {/* Terminal Header */}
                    <div className="bg-card/50 border-b border-gray-800 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TerminalIcon className="h-5 w-5 text-green-400" />
                            <span className="font-mono text-sm text-gray-400">
                                Terminal - {instance.container_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsTerminalFullscreen(!isTerminalFullscreen)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                {isTerminalFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Terminal Content */}
                    <div className={isTerminalFullscreen ? 'h-[calc(100vh-180px)]' : 'h-[400px]'}>
                        <div className="w-full h-full bg-black p-4 font-mono text-green-400 text-sm overflow-auto">
                            <div className="space-y-2">
                                <div>
                                    <span className="text-cyan-400">root@{instance.container_name}</span>
                                    <span className="text-white">:</span>
                                    <span className="text-blue-400">~</span>
                                    <span className="text-white">$ </span>
                                    <span className="animate-pulse">_</span>
                                </div>
                                <div className="text-yellow-400 mt-4">
                                    <p>⚠️ Web Terminal Integration Coming Soon!</p>
                                    <p className="text-gray-500 mt-2">This terminal will connect to your container via WebSocket.</p>
                                    <p className="text-gray-500">For now, you can access the container via:</p>
                                    <div className="mt-3 text-white">
                                        <p className="text-cyan-400">SSH Access (if available):</p>
                                        <p className="bg-gray-900 p-2 rounded mt-1">
                                            ssh root@{instance.ip_address || 'container-ip'}
                                        </p>
                                    </div>
                                    <div className="mt-3 text-white">
                                        <p className="text-cyan-400">Docker Exec:</p>
                                        <p className="bg-gray-900 p-2 rounded mt-1">
                                            docker exec -it {instance.container_name} /bin/bash
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Instance Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="cyber-border rounded-lg bg-card p-4"
                >
                    <h3 className="text-lg font-bold text-white mb-3">Instance Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Container</p>
                            <p className="text-white font-mono">{instance.container_name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">IP Address</p>
                            <p className="text-white font-mono">{instance.ip_address || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Status</p>
                            <p className="text-green-400">{instance.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Started</p>
                            <p className="text-white">{new Date(instance.started_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
