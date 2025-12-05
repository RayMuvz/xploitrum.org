import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import EventDetailPage from './event-detail-page'

interface PageProps {
    params: {
        id: string // This can be either ID or slug
    }
}

async function getEventData(eventIdentifier: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/v1/events/${encodeURIComponent(eventIdentifier)}`, {
            next: { revalidate: 60 }, // Revalidate every 60 seconds
            headers: {
                'Accept': 'application/json',
            },
        })

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Error fetching event:', error)
        return null
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const event = await getEventData(params.id)

    if (!event) {
        return {
            title: 'Event Not Found | XploitRUM',
            description: 'The requested event could not be found.',
        }
    }

    // Use absolute URL for proper meta tag support (must be absolute for social media crawlers)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xploitrum.org'
    const { slugify } = await import('@/lib/utils')
    const slug = slugify(event.title)
    const eventUrl = `${baseUrl}/events/${slug}`
    
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

    const dateTime = `${formatDate(event.start_date)} at ${formatTime(event.start_date)} - ${formatTime(event.end_date)}`
    const location = event.is_virtual ? (event.meeting_link || 'Virtual Event') : (event.location || 'Location TBA')
    const description = `${event.description}\n\n📅 ${dateTime}\n📍 ${location}`

    return {
        metadataBase: new URL(baseUrl),
        title: `${event.title} | XploitRUM Events`,
        description: description.substring(0, 160),
        openGraph: {
            type: 'website',
            url: eventUrl,
            title: event.title,
            description: description.substring(0, 200),
            siteName: 'XploitRUM',
            locale: 'en_US',
            images: [
                {
                    url: '/XPLOIT LOGOTIPO WHITE.png',
                    width: 1200,
                    height: 630,
                    alt: event.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: event.title,
            description: description.substring(0, 200),
            images: ['/XPLOIT LOGOTIPO WHITE.png'],
        },
        alternates: {
            canonical: eventUrl,
        },
    }
}

export default async function EventPage({ params }: PageProps) {
    const event = await getEventData(params.id)

    if (!event) {
        redirect('/events')
    }

    const { slugify } = await import('@/lib/utils')
    const slug = slugify(event.title)

    return <EventDetailPage eventSlug={slug} eventId={event.id} initialEvent={event} />
}

