'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Admin panel is now part of the dashboard for admin users.
 * Redirect /admin to /dashboard so bookmarks and links still work.
 */
export default function AdminPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/dashboard')
    }, [router])

    return (
        <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
            <p className="text-gray-400">Redirecting to dashboard...</p>
        </div>
    )
}
