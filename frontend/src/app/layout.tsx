import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
    title: 'XploitRUM',
    description: 'Professional cybersecurity organization for learning and professional development',
    keywords: ['cybersecurity', 'security', 'education', 'student organization', 'UPRM'],
    authors: [{ name: 'XploitRUM Team' }],
    creator: 'XploitRUM',
    publisher: 'XploitRUM',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/XPLOIT LOGOTIPO WHITE.png', type: 'image/png', sizes: '196x196' },
        ],
        shortcut: '/favicon.ico',
        apple: '/XPLOIT LOGOTIPO WHITE.png',
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://www.xploitrum.org',
        title: 'XploitRUM',
        description: 'Professional cybersecurity organization for learning and professional development',
        siteName: 'XploitRUM',
        images: [
            {
                url: '/XPLOIT LOGOTIPO WHITE.png',
                width: 1200,
                height: 630,
                alt: 'XploitRUM Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'XploitRUM',
        description: 'Professional cybersecurity organization for learning and professional development',
        images: ['/XPLOIT LOGOTIPO WHITE.png'],
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/XPLOIT LOGOTIPO WHITE.png" type="image/png" />
                <link rel="apple-touch-icon" href="/XPLOIT LOGOTIPO WHITE.png" />
                <meta name="theme-color" content="#22d3ee" />
            </head>
            <body className="font-sans">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <Navbar />
                        <div className="min-h-screen bg-background">
                            {children}
                        </div>
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
