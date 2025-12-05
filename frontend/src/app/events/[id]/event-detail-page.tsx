'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Users, ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

export default function EventDetailPage({ eventId, initialEvent }: { eventId: string, initialEvent: Event }) {
    const router = useRouter()
    const [event, setEvent] = useState<Event | null>(initialEvent)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!event) {
            fetchEvent()
        }
    }, [eventId])

    const fetchEvent = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/events/${eventId}`)
            if (response.ok) {
                const data = await response.json()
                setEvent(data)
            } else {
                router.push('/events')
            }
        } catch (error) {
            console.error('Failed to fetch event:', error)
            router.push('/events')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyber-400"></div>
            </div>
        )
    }

    if (!event) {
        return null
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <Button
                    onClick={() => router.push('/events')}
                    variant="outline"
                    className="mb-8 border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Events
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="cyber-border rounded-lg p-8 bg-card/50"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{event.title}</h1>
                    <p className="text-lg text-gray-300 mb-8 whitespace-pre-wrap">{event.description}</p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center text-gray-300">
                            <Calendar className="h-5 w-5 mr-3 text-cyber-400" />
                            {formatDate(event.start_date)}
                        </div>
                        <div className="flex items-center text-gray-300">
                            <Clock className="h-5 w-5 mr-3 text-cyber-400" />
                            {formatTime(event.start_date)} - {formatTime(event.end_date)}
                        </div>
                        {event.location && (
                            <div className="flex items-center text-gray-300">
                                <MapPin className="h-5 w-5 mr-3 text-cyber-400" />
                                {event.is_virtual ? (event.meeting_link || 'Virtual Event') : event.location}
                            </div>
                        )}
                        {event.max_participants && (
                            <div className="flex items-center text-gray-300">
                                <Users className="h-5 w-5 mr-3 text-cyber-400" />
                                {event.registered_count}/{event.max_participants} registered
                            </div>
                        )}
                    </div>

                    {event.registration_required && event.is_registration_open && !event.is_full && (
                        <Button
                            onClick={() => router.push(`/events?event=${event.id}#register`)}
                            className="bg-gradient-to-r from-cyber-400 to-neon-green text-black hover:from-cyber-500 hover:to-neon-green/80"
                        >
                            Register Now
                        </Button>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

