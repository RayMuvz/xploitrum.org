'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Check, X, Mail, Clock, User } from 'lucide-react'

interface MemberRequest {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    student_number: string | null
    password_display: string
    status: string
    created_at: string
    reviewed_by: string | null
    reviewed_at: string | null
}

export default function MemberRequestsPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [requests, setRequests] = useState<MemberRequest[]>([])
    const [filter, setFilter] = useState<string>('pending')
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        fetchRequests()
    }, [filter])

    const fetchRequests = async () => {
        try {
            setIsLoading(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const url = filter === 'all'
                ? `${apiUrl}/api/v1/member-requests/`
                : `${apiUrl}/api/v1/member-requests/?status_filter=${filter}`

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch requests')
            }

            const data = await response.json()
            setRequests(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch member requests.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleAccept = async (requestId: string) => {
        try {
            setActionLoading(requestId)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const response = await fetch(`${apiUrl}/api/v1/member-requests/${requestId}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to accept request')
            }

            const data = await response.json()

            toast({
                title: "Request Accepted",
                description: data.temp_password
                    ? `User account created. Temporary password: ${data.temp_password}`
                    : "User account created. They can log in with the password they set in their request.",
            })

            // Refresh the list
            fetchRequests()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to accept request.",
                variant: "destructive",
            })
        } finally {
            setActionLoading(null)
        }
    }

    const handleDecline = async (requestId: string) => {
        if (!confirm('Are you sure you want to decline this request?')) {
            return
        }

        try {
            setActionLoading(requestId)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const response = await fetch(`${apiUrl}/api/v1/member-requests/${requestId}/decline`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to decline request')
            }

            toast({
                title: "Request Declined",
                description: "The member request has been declined.",
            })

            // Refresh the list
            fetchRequests()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to decline request.",
                variant: "destructive",
            })
        } finally {
            setActionLoading(null)
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            accepted: 'bg-green-500/20 text-green-400 border-green-500/50',
            declined: 'bg-red-500/20 text-red-400 border-red-500/50'
        }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.pending}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background pt-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                Member <span className="text-cyber-400">Requests</span>
                            </h1>
                            <p className="text-xl text-gray-400">
                                Manage member account requests
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filter Tabs */}
                    <div className="mb-6 flex space-x-4 border-b border-gray-700">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`pb-4 px-4 font-medium transition-colors ${filter === 'pending'
                                    ? 'text-cyber-400 border-b-2 border-cyber-400'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            Pending ({requests.filter(r => r.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setFilter('accepted')}
                            className={`pb-4 px-4 font-medium transition-colors ${filter === 'accepted'
                                    ? 'text-cyber-400 border-b-2 border-cyber-400'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            Accepted ({requests.filter(r => r.status === 'accepted').length})
                        </button>
                        <button
                            onClick={() => setFilter('declined')}
                            className={`pb-4 px-4 font-medium transition-colors ${filter === 'declined'
                                    ? 'text-cyber-400 border-b-2 border-cyber-400'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            Declined ({requests.filter(r => r.status === 'declined').length})
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`pb-4 px-4 font-medium transition-colors ${filter === 'all'
                                    ? 'text-cyber-400 border-b-2 border-cyber-400'
                                    : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            All ({requests.length})
                        </button>
                    </div>

                    {/* Requests List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400 mx-auto"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="cyber-border rounded-lg p-12 text-center">
                            <User className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Requests Found</h3>
                            <p className="text-gray-400">
                                {filter === 'pending'
                                    ? 'No pending member requests at this time.'
                                    : `No ${filter} requests found.`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="cyber-border rounded-lg p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4 mb-3">
                                                <h3 className="text-xl font-semibold text-white">
                                                    {request.first_name} {request.last_name}
                                                </h3>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-400">
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="h-4 w-4" />
                                                    <span>{request.email}</span>
                                                </div>
                                                {request.phone && (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="ml-6">{request.phone}</span>
                                                    </div>
                                                )}
                                                {request.student_number && (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="ml-6">Student #: {request.student_number}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center space-x-2">
                                                    <span className="ml-6">Password: {request.password_display}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                                                </div>
                                                {request.reviewed_at && (
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                        <span>Reviewed by: {request.reviewed_by}</span>
                                                        <span>•</span>
                                                        <span>{new Date(request.reviewed_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {request.status === 'pending' && (
                                            <div className="flex space-x-3 ml-6">
                                                <Button
                                                    onClick={() => handleAccept(request.id)}
                                                    disabled={actionLoading === request.id}
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                >
                                                    {actionLoading === request.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Accept
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => handleDecline(request.id)}
                                                    disabled={actionLoading === request.id}
                                                    variant="destructive"
                                                >
                                                    {actionLoading === request.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <>
                                                            <X className="h-4 w-4 mr-2" />
                                                            Decline
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
}

