'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, Trophy, Award, Plus, Filter, X, Mail, Phone, User as UserIcon, Share2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { slugify } from '@/lib/utils'

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

interface RegistrationFormData {
    full_name: string
    email: string
    phone: string
    year_of_study: string
}

export default function EventsPage() {
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
    const [pastEvents, setPastEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showRegistrationModal, setShowRegistrationModal] = useState(false)
    const [registrationForm, setRegistrationForm] = useState<RegistrationFormData>({
        full_name: '',
        email: '',
        phone: '',
        year_of_study: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchEvents()
        // Set up real-time updates every 30 seconds
        const interval = setInterval(fetchEvents, 30000)
        return () => clearInterval(interval)
    }, [])

    // Handle event ID from URL query params (redirect to dedicated event page)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const eventIdParam = urlParams.get('event')

        if (eventIdParam) {
            const eventId = parseInt(eventIdParam, 10)
            if (!isNaN(eventId)) {
                // Redirect to dedicated event page for rich previews
                window.location.href = `/events/${eventId}`
            }
        }
    }, [])

    const fetchEvents = async () => {
        try {
            // Fetch upcoming events
            const upcomingResponse = await fetch('/api/events?upcoming_only=true&limit=10')
            if (upcomingResponse.ok) {
                const upcomingData = await upcomingResponse.json()
                console.log('Upcoming events fetched:', upcomingData) // Debug log
                setUpcomingEvents(upcomingData)
            } else {
                console.error('Failed to fetch upcoming events:', upcomingResponse.status)
            }

            // Fetch past events
            const pastResponse = await fetch('/api/events?status=completed&limit=10')
            if (pastResponse.ok) {
                const pastData = await pastResponse.json()
                console.log('Past events fetched:', pastData) // Debug log
                setPastEvents(pastData)
            } else {
                console.error('Failed to fetch past events:', pastResponse.status)
            }
        } catch (error) {
            console.error('Failed to fetch events:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleShowDetails = (event: Event) => {
        setSelectedEvent(event)
        setShowDetailsModal(true)
    }

    const handleRegister = (event: Event) => {
        setSelectedEvent(event)
        // Pre-fill form if user is logged in
        if (isAuthenticated && user) {
            setRegistrationForm({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: '',
                year_of_study: ''
            })
        } else {
            // Empty form for guests
            setRegistrationForm({
                full_name: '',
                email: '',
                phone: '',
                year_of_study: ''
            })
        }
        setShowRegistrationModal(true)
    }

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '')

        // Format as XXX-XXX-XXXX
        if (cleaned.length <= 3) {
            return cleaned
        } else if (cleaned.length <= 6) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
        } else {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setRegistrationForm({ ...registrationForm, phone: formatted })
    }

    const handleSubmitRegistration = async () => {
        if (!selectedEvent) return

        setIsSubmitting(true)
        try {
            const headers: any = {
                'Content-Type': 'application/json'
            }

            // Add auth header only if user is logged in
            if (isAuthenticated) {
                const authTokens = localStorage.getItem('auth_tokens')
                const token = authTokens ? JSON.parse(authTokens).access_token : ''
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`
                }
            }

            const response = await fetch(`/api/events/${selectedEvent.id}/register`, {
                method: 'POST',
                headers,
                body: JSON.stringify(registrationForm)
            })

            if (response.ok) {
                toast({
                    title: "Registration Successful!",
                    description: `You've been registered for ${selectedEvent.title}`
                })
                setShowRegistrationModal(false)
                setRegistrationForm({
                    full_name: '',
                    email: '',
                    phone: '',
                    year_of_study: ''
                })
                fetchEvents() // Refresh to show updated registration count
            } else {
                const error = await response.json()
                toast({
                    title: "Registration Failed",
                    description: error.detail || "Failed to register for event",
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
            setIsSubmitting(false)
        }
    }

    const formatDate = (dateString: string) => {
        // Parse the date string - if it's UTC, convert to local time for display
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        // Parse the date string - if it's UTC, convert to local time for display
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // Use 12-hour format with AM/PM
        })
    }

    const getEventTypeIcon = (eventType: string) => {
        switch (eventType.toLowerCase()) {
            case 'ctf': return '🏆'
            case 'workshop': return '🎓'
            case 'presentation': return '📊'
            case 'meeting': return '👥'
            case 'social': return '🎉'
            default: return '📅'
        }
    }

    const getEventTypeColor = (eventType: string) => {
        switch (eventType.toLowerCase()) {
            case 'ctf': return 'from-yellow-400 to-orange-500'
            case 'workshop': return 'from-blue-400 to-cyan-500'
            case 'presentation': return 'from-purple-400 to-pink-500'
            case 'meeting': return 'from-green-400 to-emerald-500'
            case 'social': return 'from-pink-400 to-rose-500'
            default: return 'from-gray-400 to-gray-500'
        }
    }

    // Check if event is active (not ended)
    const isEventActive = (event: Event) => {
        const now = new Date()
        const endDate = new Date(event.end_date)
        return endDate > now
    }

    // Get event-specific share URL with slug
    const getEventShareUrl = (event: Event) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xploitrum.org'
        const slug = slugify(event.title)
        return `${baseUrl}/events/${slug}`
    }

    // Share event using native Web Share API - only title and link
    const shareEvent = async (event: Event) => {
        const eventUrl = getEventShareUrl(event)

        // Create share data with only title and URL (metadata will be pulled from the page)
        const shareData: ShareData = {
            title: event.title,
            url: eventUrl
        }

        try {
            // Check if Web Share API is supported
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData)
                toast({
                    title: "Shared!",
                    description: "Event shared successfully"
                })
            } else {
                // Fallback: copy link to clipboard
                await navigator.clipboard.writeText(eventUrl)
                toast({
                    title: "Link Copied!",
                    description: "Event link has been copied to your clipboard"
                })
            }
        } catch (error: any) {
            // User cancelled or error occurred
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error)
                // Fallback: copy link to clipboard
                try {
                    await navigator.clipboard.writeText(eventUrl)
                    toast({
                        title: "Link Copied!",
                        description: "Event link has been copied to your clipboard"
                    })
                } catch (clipError) {
                    toast({
                        title: "Share Failed",
                        description: "Unable to share event. Please try again.",
                        variant: "destructive"
                    })
                }
            }
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Upcoming <span className="text-cyber-400">Events</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Join our cybersecurity community events, workshops, and competitions
                        </p>

                        {isAuthenticated && user?.role === 'admin' && (
                            <div className="mt-6">
                                <Button
                                    onClick={() => window.location.href = '/admin/events'}
                                    className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Manage Events
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Featured Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-16"
                    >
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">
                            Upcoming <span className="text-cyber-400">Events</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.slice(0, 6).map((event) => (
                                <div key={event.id} className="cyber-border p-6 rounded-lg bg-card/50 hover:bg-card/70 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                                            <span className="text-sm text-gray-500 capitalize">{event.event_type}</span>
                                        </div>
                                        {event.is_featured && (
                                            <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-xs">
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>

                                    <div className="space-y-2 text-sm mb-4">
                                        <div className="flex items-center text-gray-300">
                                            <Calendar className="h-4 w-4 mr-2 text-cyber-400" />
                                            {formatDate(event.start_date)}
                                        </div>
                                        <div className="flex items-center text-gray-300">
                                            <Clock className="h-4 w-4 mr-2 text-cyber-400" />
                                            {formatTime(event.start_date)} - {formatTime(event.end_date)}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center text-gray-300">
                                                <MapPin className="h-4 w-4 mr-2 text-cyber-400" />
                                                {event.location}
                                            </div>
                                        )}
                                        {event.max_participants && (
                                            <div className="flex items-center text-gray-300">
                                                <Users className="h-4 w-4 mr-2 text-cyber-400" />
                                                {event.registered_count}/{event.max_participants} registered
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {event.registration_required && (
                                            event.is_registration_open && !event.is_full ? (
                                                <button
                                                    onClick={() => handleRegister(event)}
                                                    className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black px-4 py-2 rounded text-sm font-semibold hover:from-cyber-500 hover:to-neon-green/80 transition-all"
                                                >
                                                    Register
                                                </button>
                                            ) : (
                                                <button disabled className="flex-1 bg-gray-600 text-gray-400 px-4 py-2 rounded text-sm font-semibold cursor-not-allowed">
                                                    {event.is_full ? 'Full' : 'Registration Closed'}
                                                </button>
                                            )
                                        )}

                                        <button
                                            onClick={() => handleShowDetails(event)}
                                            className={`${event.registration_required ? '' : 'flex-1'} border border-cyber-400 text-cyber-400 px-4 py-2 rounded text-sm font-semibold hover:bg-cyber-400 hover:text-black transition-all`}
                                        >
                                            Details
                                        </button>

                                        {/* Share Button - Only for active events */}
                                        {isEventActive(event) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    shareEvent(event)
                                                }}
                                                className="border border-cyber-400 text-cyber-400 px-3 py-2 rounded text-sm font-semibold hover:bg-cyber-400 hover:text-black transition-all"
                                                title="Share event"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-8 text-center">
                            Past <span className="text-cyber-400">Events</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastEvents.slice(0, 6).map((event) => (
                                <div key={event.id} className="cyber-border p-6 rounded-lg bg-card/50 opacity-75">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                                            <span className="text-sm text-gray-500 capitalize">{event.event_type}</span>
                                        </div>
                                        <span className="text-sm text-gray-400">Completed</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-gray-300">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                            {formatDate(event.end_date)}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center text-gray-300">
                                                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                                {event.location}
                                            </div>
                                        )}
                                        {event.max_participants && (
                                            <div className="flex items-center text-gray-300">
                                                <Users className="h-4 w-4 mr-2 text-gray-500" />
                                                {event.registered_count} attended
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* No Events Message */}
                {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-center py-16"
                    >
                        <div className="text-6xl mb-4">📅</div>
                        <h2 className="text-2xl font-bold text-white mb-4">No Events Available</h2>
                        <p className="text-gray-400 mb-8">
                            Check back later for upcoming cybersecurity events and workshops.
                        </p>
                        {isAuthenticated && user?.role === 'admin' && (
                            <Button
                                onClick={() => window.location.href = '/admin/events'}
                                className="bg-gradient-to-r from-cyber-400 to-neon-green text-black"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Event
                            </Button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Event Details Modal */}
            <AnimatePresence>
                {showDetailsModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowDetailsModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card cyber-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">{selectedEvent.title}</h2>
                                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-cyber-400 mb-2">Description</h3>
                                    <p className="text-gray-300">{selectedEvent.description}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-cyber-400 mb-1">Event Type</h3>
                                        <p className="text-gray-300 capitalize">{selectedEvent.event_type}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-cyber-400 mb-1">Status</h3>
                                        <p className="text-gray-300 capitalize">{selectedEvent.status}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-cyber-400 mb-1">When</h3>
                                    <div className="flex items-center text-gray-300">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {formatDate(selectedEvent.start_date)}
                                    </div>
                                    <div className="flex items-center text-gray-300 mt-1">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {formatTime(selectedEvent.start_date)} - {formatTime(selectedEvent.end_date)}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-cyber-400 mb-1">Location</h3>
                                    <div className="flex items-center text-gray-300">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        {selectedEvent.is_virtual ? (
                                            <span>Virtual Event{selectedEvent.meeting_link && ` - ${selectedEvent.meeting_link}`}</span>
                                        ) : (
                                            <span>{selectedEvent.location || 'TBA'}</span>
                                        )}
                                    </div>
                                </div>

                                {selectedEvent.max_participants && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-cyber-400 mb-1">Capacity</h3>
                                        <div className="flex items-center text-gray-300">
                                            <Users className="h-4 w-4 mr-2" />
                                            {selectedEvent.registered_count}/{selectedEvent.max_participants} registered
                                            {selectedEvent.is_full && <span className="ml-2 text-red-400">(Full)</span>}
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.registration_required && selectedEvent.registration_deadline && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-cyber-400 mb-1">Registration Deadline</h3>
                                        <p className="text-gray-300">{formatDate(selectedEvent.registration_deadline)}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-4">
                                {selectedEvent.registration_required && selectedEvent.is_registration_open && !selectedEvent.is_full && (
                                    <Button
                                        onClick={() => {
                                            setShowDetailsModal(false)
                                            handleRegister(selectedEvent)
                                        }}
                                        className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500 hover:to-neon-green/80"
                                    >
                                        Register Now
                                    </Button>
                                )}

                                {/* Share Button - Only for active events */}
                                {isEventActive(selectedEvent) && (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            shareEvent(selectedEvent)
                                        }}
                                        variant="outline"
                                        className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                )}

                                <Button
                                    onClick={() => {
                                        setShowDetailsModal(false)
                                    }}
                                    variant="outline"
                                    className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Registration Modal */}
            <AnimatePresence>
                {showRegistrationModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowRegistrationModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card cyber-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Register for {selectedEvent.title}</h2>
                                <button onClick={() => setShowRegistrationModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <UserIcon className="inline h-4 w-4 mr-1" />
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={registrationForm.full_name}
                                        onChange={(e) => setRegistrationForm({ ...registrationForm, full_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <Mail className="inline h-4 w-4 mr-1" />
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={registrationForm.email}
                                        onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <Phone className="inline h-4 w-4 mr-1" />
                                        Phone Number * (XXX-XXX-XXXX)
                                    </label>
                                    <input
                                        type="tel"
                                        value={registrationForm.phone}
                                        onChange={handlePhoneChange}
                                        placeholder="123-456-7890"
                                        maxLength={12}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Year of Study *</label>
                                    <select
                                        value={registrationForm.year_of_study}
                                        onChange={(e) => setRegistrationForm({ ...registrationForm, year_of_study: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        required
                                    >
                                        <option value="">Select year</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="Graduate">Graduate</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-4">
                                <Button
                                    onClick={handleSubmitRegistration}
                                    disabled={isSubmitting || !registrationForm.full_name || !registrationForm.email || !registrationForm.phone || !registrationForm.year_of_study || registrationForm.phone.replace(/\D/g, '').length !== 10}
                                    className="flex-1 bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500 hover:to-neon-green/80 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                                </Button>
                                <Button
                                    onClick={() => setShowRegistrationModal(false)}
                                    variant="outline"
                                    className="flex-1 border-gray-600 text-gray-400 hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}