import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { Navbar } from '@/components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'XploitRUM',
    description: 'Professional cybersecurity organization and CTF platform for learning and competitions',
    keywords: ['cybersecurity', 'CTF', 'capture the flag', 'hacking', 'security', 'education'],
    authors: [{ name: 'XploitRUM Team' }],
    creator: 'XploitRUM',
    publisher: 'XploitRUM',
    icons: {
        icon: '/XPLOIT LOGOTIPO WHITE.png',
        shortcut: '/XPLOIT LOGOTIPO WHITE.png',
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
        description: 'Professional cybersecurity organization and CTF platform for learning and competitions',
        siteName: 'XploitRUM',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'XploitRUM',
        description: 'Professional cybersecurity organization and CTF platform for learning and competitions',
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
                <link rel="icon" href="/XPLOIT LOGOTIPO WHITE.png" type="image/png" />
                <link rel="apple-touch-icon" href="/XPLOIT LOGOTIPO WHITE.png" />
            </head>
            <body className={inter.className}>
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
