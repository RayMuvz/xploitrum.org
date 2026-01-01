'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Plus,
    Calendar,
    Clock,
    Users,
    MapPin,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    Save,
    X,
    Download
} from 'lucide-react'
import { AdminRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Event {
    id: number
    title: string
    description: string
    event_type: string
    status: string
    start_date: string
    end_date: string
    location?: string
    is_virtual: boolean
    meeting_link?: string
    max_participants?: number
    registration_required: boolean
    registration_deadline?: string
    is_featured: boolean
    registered_count: number
    is_registration_open: boolean
    is_full: boolean
    created_at: string
}

interface EventFormData {
    title: string
    description: string
    event_type: string
    start_date: string
    end_date: string
    location: string
    is_virtual: boolean
    meeting_link: string
    max_participants: string
    registration_required: boolean
    registration_deadline: string
    is_featured: boolean
}

export default function AdminEventsPage() {
    const { user } = useAuth()
    const { toast } = useToast()

    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [showRegistrantsModal, setShowRegistrantsModal] = useState(false)
    const [selectedEventForRegistrants, setSelectedEventForRegistrants] = useState<Event | null>(null)
    const [registrants, setRegistrants] = useState<any[]>([])
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        event_type: 'ctf',
        start_date: '',
        end_date: '',
        location: '',
        is_virtual: false,
        meeting_link: '',
        max_participants: '',
        registration_required: false,
        registration_deadline: '',
        is_featured: false
    })

    useEffect(() => {
        fetchEvents()
        // Set up real-time updates every 30 seconds
        const interval = setInterval(fetchEvents, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events?limit=100', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                console.log('Admin events fetched:', data) // Debug log
                setEvents(data)
            } else {
                console.error('Failed to fetch events:', response.status, response.statusText)
            }
        } catch (error) {
            console.error('Failed to fetch events:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const updateEventStatuses = async () => {
        try {
            const response = await fetch('/api/events/update-statuses', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Status Updated",
                    description: `Updated ${data.updated_count} event statuses`,
                })
                fetchEvents()
            }
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Failed to update event statuses",
                variant: "destructive",
            })
        }
    }

    const handleCreateEvent = async () => {
        try {
            // Convert datetime-local format to ISO string with timezone
            const prepareDateForServer = (dateString: string) => {
                if (!dateString) return null
                // datetime-local gives "YYYY-MM-DDTHH:mm" format (no timezone)
                // We need to treat it as local time and convert to UTC
                const localDate = new Date(dateString)
                return localDate.toISOString()
            }

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({
                    ...formData,
                    start_date: prepareDateForServer(formData.start_date),
                    end_date: prepareDateForServer(formData.end_date),
                    max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
                    registration_deadline: formData.registration_deadline ? prepareDateForServer(formData.registration_deadline) : null
                })
            })

            if (response.ok) {
                toast({
                    title: "Event Created",
                    description: "Event has been created successfully",
                })
                setShowCreateForm(false)
                resetForm()
                fetchEvents()
            } else {
                const error = await response.json()
                toast({
                    title: "Creation Failed",
                    description: error.detail || "Failed to create event",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Creation Failed",
                description: "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const handleUpdateEvent = async () => {
        if (!editingEvent) return

        try {
            // Convert datetime-local format to ISO string with timezone
            const prepareDateForServer = (dateString: string) => {
                if (!dateString) return null
                // datetime-local gives "YYYY-MM-DDTHH:mm" format (no timezone)
                // We need to treat it as local time and convert to UTC
                const localDate = new Date(dateString)
                return localDate.toISOString()
            }

            const response = await fetch(`/api/events/${editingEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                },
                body: JSON.stringify({
                    ...formData,
                    start_date: prepareDateForServer(formData.start_date),
                    end_date: prepareDateForServer(formData.end_date),
                    max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
                    registration_deadline: formData.registration_deadline ? prepareDateForServer(formData.registration_deadline) : null
                })
            })

            if (response.ok) {
                toast({
                    title: "Event Updated",
                    description: "Event has been updated successfully",
                })
                setEditingEvent(null)
                resetForm()
                fetchEvents()
            } else {
                const error = await response.json().catch(() => ({ error: 'Failed to update event' }))
                console.error('Update error:', error)
                toast({
                    title: "Update Failed",
                    description: error.detail || error.error || "Failed to update event",
                    variant: "destructive",
                })
            }
        } catch (error: any) {
            console.error('Update error:', error)
            toast({
                title: "Update Failed",
                description: error.message || "Network error occurred",
                variant: "destructive",
            })
        }
    }

    const handleDeleteEvent = async (eventId: number) => {
        if (!confirm('Are you sure you want to delete this event?')) return

        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access_token : ''}`
                }
            })

            if (response.ok) {
                toast({
                    title: "Event Deleted",
                    description: "Event has been deleted successfully",
                })
                fetchEvents()
            } else {
                const error = await response.json()
                toast({
                    title: "Deletion Failed",
                    description: error.detail || "Failed to delete event",
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

    const handleViewRegistrants = async (event: Event) => {
        setSelectedEventForRegistrants(event)
        setShowRegistrantsModal(true)

        // Fetch registrants for this event
        try {
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const response = await fetch(`/api/events/${event.id}/registrations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setRegistrants(data)
            }
        } catch (error) {
            console.error('Failed to fetch registrants:', error)
            setRegistrants([])
        }
    }

    const handleDownloadRegistrants = (event: Event) => {
        if (registrants.length === 0) {
            toast({
                title: "No Registrants",
                description: "No one has registered for this event yet",
                variant: "destructive"
            })
            return
        }

        // Create CSV content
        const csvContent = [
            ['Name', 'Email', 'Phone', 'Year of Study', 'Registered At'],
            ...registrants.map((r: any) => [
                r.full_name || r.user?.full_name || '',
                r.email || r.user?.email || '',
                r.phone || '',
                r.year_of_study || '',
                new Date(r.registration_date).toLocaleString()
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${event.title.replace(/\s+/g, '_')}_registrants_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
            title: "Download Started",
            description: "Registrants list has been downloaded"
        })
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            event_type: 'ctf',
            start_date: '',
            end_date: '',
            location: '',
            is_virtual: false,
            meeting_link: '',
            max_participants: '',
            registration_required: false,
            registration_deadline: '',
            is_featured: false
        })
    }

    const startEdit = (event: Event) => {
        setEditingEvent(event)

        // Convert UTC dates to local time for datetime-local input
        const formatDateForInput = (dateString: string) => {
            const date = new Date(dateString)
            // Get local time components
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        setFormData({
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            start_date: formatDateForInput(event.start_date),
            end_date: formatDateForInput(event.end_date),
            location: event.location || '',
            is_virtual: event.is_virtual,
            meeting_link: event.meeting_link || '',
            max_participants: event.max_participants?.toString() || '',
            registration_required: event.registration_required,
            registration_deadline: event.registration_deadline ? formatDateForInput(event.registration_deadline) : '',
            is_featured: event.is_featured
        })
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'upcoming': return <Clock className="h-4 w-4 text-blue-400" />
            case 'active': return <CheckCircle className="h-4 w-4 text-green-400" />
            case 'completed': return <XCircle className="h-4 w-4 text-gray-400" />
            case 'cancelled': return <XCircle className="h-4 w-4 text-red-400" />
            default: return <AlertCircle className="h-4 w-4 text-yellow-400" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-400/20 text-blue-400'
            case 'active': return 'bg-green-400/20 text-green-400'
            case 'completed': return 'bg-gray-400/20 text-gray-400'
            case 'cancelled': return 'bg-red-400/20 text-red-400'
            default: return 'bg-yellow-400/20 text-yellow-400'
        }
    }

    if (isLoading) {
        return (
            <AdminRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
                </div>
            </AdminRoute>
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
                            className="flex items-center justify-between"
                        >
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                    Event <span className="text-cyber-400">Management</span>
                                </h1>
                                <p className="text-xl text-gray-400">
                                    Manage organization events and track real-time updates
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={updateEventStatuses}
                                    variant="outline"
                                    className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                                >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Update Statuses
                                </Button>

                                <Button
                                    onClick={() => setShowCreateForm(true)}
                                    className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Event
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Events Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {events.map((event) => (
                            <div key={event.id} className="cyber-border p-6 rounded-lg bg-card/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(event.status)}
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(event)}
                                            className="p-2 text-gray-400 hover:text-cyber-400 transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-gray-300">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {new Date(event.start_date).toLocaleDateString()}
                                    </div>

                                    {event.location && (
                                        <div className="flex items-center text-gray-300">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {event.location}
                                        </div>
                                    )}

                                    <div className="flex items-center text-gray-300">
                                        <Users className="h-4 w-4 mr-2" />
                                        {event.registered_count}{event.max_participants ? `/${event.max_participants}` : ''} registered
                                    </div>
                                </div>

                                {event.is_featured && (
                                    <div className="mt-3">
                                        <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-xs">
                                            Featured
                                        </span>
                                    </div>
                                )}

                                {/* View/Download Registrants Button */}
                                {event.registration_required && event.registered_count > 0 && (
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            onClick={() => handleViewRegistrants(event)}
                                            size="sm"
                                            className="flex-1 bg-cyber-400 text-black hover:bg-cyber-500"
                                        >
                                            <Users className="h-4 w-4 mr-1" />
                                            View Registrants ({event.registered_count})
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Create/Edit Event Modal */}
                {(showCreateForm || editingEvent) && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="cyber-border p-6 rounded-lg bg-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingEvent ? 'Edit Event' : 'Create Event'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        setEditingEvent(null)
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
                                        Event Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="Enter event title"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="Enter event description"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Event Type
                                    </label>
                                    <select
                                        value={formData.event_type}
                                        onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                    >
                                        <option value="ctf">CTF</option>
                                        <option value="workshop">Workshop</option>
                                        <option value="presentation">Presentation</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="social">Social</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Start Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        End Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="Enter location"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Meeting Link
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.meeting_link}
                                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                        placeholder="https://..."
                                    />
                                </div>

                                {/* Registration Settings Section */}
                                <div className="md:col-span-2 cyber-border p-4 rounded-lg bg-card/30">
                                    <label className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            checked={formData.registration_required}
                                            onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                                            className="mr-2 h-5 w-5"
                                        />
                                        <div>
                                            <span className="text-white font-semibold">Require Registration</span>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formData.registration_required
                                                    ? "Event requires registration - registration button will appear on event page"
                                                    : "Event is open to everyone - no registration button will appear"}
                                            </p>
                                        </div>
                                    </label>

                                    {formData.registration_required && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Max Participants
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.max_participants}
                                                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                                    className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white placeholder-gray-500"
                                                    placeholder="Leave empty for unlimited"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Registration Deadline
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.registration_deadline}
                                                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                                                    className="w-full px-3 py-2 bg-background border border-gray-600 rounded text-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 md:col-span-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_virtual}
                                            onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span className="text-gray-300">Virtual Event</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <span className="text-gray-300">Featured</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                                    className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingEvent ? 'Update Event' : 'Create Event'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowCreateForm(false)
                                        setEditingEvent(null)
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
                )}

                {/* Registrants Modal */}
                {showRegistrantsModal && selectedEventForRegistrants && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRegistrantsModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="cyber-border p-6 rounded-lg bg-card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    Registrants for {selectedEventForRegistrants.title}
                                </h2>
                                <button
                                    onClick={() => setShowRegistrantsModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mb-4 flex justify-between items-center">
                                <p className="text-gray-400">
                                    Total Registrants: <span className="text-cyber-400 font-semibold">{registrants.length}</span>
                                </p>
                                <Button
                                    onClick={() => handleDownloadRegistrants(selectedEventForRegistrants)}
                                    className="bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download CSV
                                </Button>
                            </div>

                            {registrants.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                                    <p className="text-gray-400">No registrants yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {registrants.map((registrant: any, idx: number) => (
                                        <div key={idx} className="bg-background border border-border rounded-lg p-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-400">Name</p>
                                                    <p className="text-white font-medium">{registrant.full_name || registrant.user?.full_name || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Email</p>
                                                    <p className="text-white">{registrant.email || registrant.user?.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Phone</p>
                                                    <p className="text-white">{registrant.phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Year of Study</p>
                                                    <p className="text-white">{registrant.year_of_study || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-500">
                                                Registered: {new Date(registrant.registration_date).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6">
                                <Button
                                    onClick={() => setShowRegistrantsModal(false)}
                                    variant="outline"
                                    className="w-full border-gray-600 text-gray-400 hover:bg-gray-800"
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminRoute>
    )
}
