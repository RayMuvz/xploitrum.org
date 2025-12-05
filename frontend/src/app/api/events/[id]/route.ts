import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        
        const response = await fetch(`${apiUrl}/api/v1/events/${eventId}`, {
            headers: {
                'Accept': 'application/json',
            },
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: response.status }
            )
        }

        const event = await response.json()
        return NextResponse.json(event)
    } catch (error) {
        console.error('Error fetching event:', error)
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        )
    }
}

