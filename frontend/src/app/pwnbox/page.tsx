'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Terminal as TerminalIcon,
    Globe,
    Maximize2,
    Minimize2,
    X,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function PwnboxContent() {
    const searchParams = useSearchParams()
    const machineId = searchParams.get('machine')
    
    const [targetIP, setTargetIP] = useState('10.10.10.X')
    const [terminalExpanded, setTerminalExpanded] = useState(false)
    const [browserExpanded, setBrowserExpanded] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        if (machineId) {
            fetchMachineDetails()
        }
    }, [machineId])

    const fetchMachineDetails = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/machines/active`)
            
            if (response.ok) {
                const data = await response.json()
                setTargetIP(data.ip_address)
            }
        } catch (error) {
            console.error('Failed to fetch machine details:', error)
        }
    }

    const refreshBrowser = () => {
        if (iframeRef.current) {
            iframeRef.current.src = iframeRef.current.src
        }
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Pwnbox Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-white font-mono text-sm">Pwnbox - ParrotOS Security</span>
                    <span className="text-gray-400 text-sm">Target: {targetIP}</span>
                </div>
                <button
                    onClick={() => window.close()}
                    className="text-gray-400 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Terminal */}
                <div className={`${terminalExpanded ? 'flex-1' : 'h-1/2'} border-b border-gray-700 flex flex-col`}>
                    <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TerminalIcon className="h-4 w-4 text-green-400" />
                            <span className="text-white text-sm font-mono">Terminal</span>
                        </div>
                        <button
                            onClick={() => setTerminalExpanded(!terminalExpanded)}
                            className="text-gray-400 hover:text-white"
                        >
                            {terminalExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                    </div>
                    
                    <div className="flex-1 bg-black p-4 overflow-auto">
                        <div className="font-mono text-sm text-green-400">
                            <p className="text-cyan-400">┌──(root㉿pwnbox)-[~]</p>
                            <p className="text-cyan-400">└─$ <span className="animate-pulse">_</span></p>
                            <div className="mt-4 text-yellow-400">
                                <p>🚧 Interactive Terminal Coming Soon!</p>
                                <p className="text-gray-500 mt-2">For now, use these commands via SSH or local terminal:</p>
                                <div className="mt-3 space-y-2 text-white">
                                    <p className="text-cyan-400">Connect via OpenVPN:</p>
                                    <p className="bg-gray-900 p-2 rounded">$ sudo openvpn xploitrum.ovpn</p>
                                    
                                    <p className="text-cyan-400 mt-4">Scan the target:</p>
                                    <p className="bg-gray-900 p-2 rounded">$ nmap -sC -sV {targetIP}</p>
                                    
                                    <p className="text-cyan-400 mt-4">Access web services:</p>
                                    <p className="bg-gray-900 p-2 rounded">$ curl http://{targetIP}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Browser */}
                {!terminalExpanded && (
                    <div className="h-1/2 flex flex-col">
                        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Globe className="h-4 w-4 text-blue-400" />
                                <div className="flex-1 bg-gray-900 rounded px-3 py-1">
                                    <span className="text-gray-400 text-sm font-mono">
                                        http://{targetIP}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={refreshBrowser}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setBrowserExpanded(!browserExpanded)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {browserExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-white">
                            <iframe
                                ref={iframeRef}
                                src={`http://${targetIP}`}
                                className="w-full h-full"
                                title="Target Machine Browser"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function PwnboxPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400"></div>
            </div>
        }>
            <PwnboxContent />
        </Suspense>
    )
}

