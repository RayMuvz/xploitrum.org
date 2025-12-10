import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        
        const response = await fetch(`${apiUrl}/api/v1/events/${encodeURIComponent(eventId)}`, {
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

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        
        // Get the authorization header from the request
        const authHeader = request.headers.get('Authorization')
        
        // Get the request body
        const body = await request.json()
        
        const response = await fetch(`${apiUrl}/api/v1/events/${encodeURIComponent(eventId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(authHeader && { 'Authorization': authHeader }),
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to update event' }))
            return NextResponse.json(
                { error: errorData.detail || 'Failed to update event' },
                { status: response.status }
            )
        }

        const event = await response.json()
        return NextResponse.json(event)
    } catch (error) {
        console.error('Error updating event:', error)
        return NextResponse.json(
            { error: 'Failed to update event' },
            { status: 500 }
        )
    }
}

