'use client'

import { useState } from 'react'
import { Menu, X, User, LogOut, Trophy, Settings, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const { user, isAuthenticated, logout } = useAuth()

    return (
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <a href="/" className="flex items-center">
                            <img src="/XPLOIT LOGOTIPO WHITE.png" alt="XploitRUM" className="h-10 w-auto" />
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="/" className="text-gray-300 hover:text-cyber-400 transition-colors">
                            Home
                        </a>
                        <a href="/about" className="text-gray-300 hover:text-cyber-400 transition-colors">
                            About
                        </a>
                        <a href="/events" className="text-gray-300 hover:text-cyber-400 transition-colors">
                            Events
                        </a>
                        <a href="/machines" className="text-gray-300 hover:text-cyber-400 transition-colors">
                            Machines
                        </a>
                        <a href="/contact" className="text-gray-300 hover:text-cyber-400 transition-colors">
                            Contact
                        </a>

                        {isAuthenticated ? (
                            /* Authenticated User Menu */
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center space-x-2 text-gray-300 hover:text-cyber-400 transition-colors"
                                >
                                    <User className="h-5 w-5" />
                                    <span>{user?.username}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-cyber-400/20 rounded-lg shadow-lg">
                                        <div className="p-3 border-b border-gray-700">
                                            <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                                            <p className="text-xs text-gray-400">{user?.score} points</p>
                                        </div>
                                        <a href="/dashboard" className="flex items-center px-3 py-2 text-gray-300 hover:text-cyber-400 hover:bg-cyber-400/10 transition-colors">
                                            <Trophy className="h-4 w-4 mr-2" />
                                            Dashboard
                                        </a>
                                        <a href="/profile" className="flex items-center px-3 py-2 text-gray-300 hover:text-cyber-400 hover:bg-cyber-400/10 transition-colors">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Profile
                                        </a>
                                        {user?.role === 'admin' && (
                                            <a href="/admin" className="flex items-center px-3 py-2 text-gray-300 hover:text-cyber-400 hover:bg-cyber-400/10 transition-colors">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Admin Panel
                                            </a>
                                        )}
                                        <button
                                            onClick={logout}
                                            className="flex items-center w-full px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Guest User Menu */
                            <div className="flex items-center space-x-4">
                                <a href="/login" className="text-gray-300 hover:text-cyber-400 transition-colors">
                                    Login
                                </a>
                                <Button asChild variant="outline" size="sm" className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black">
                                    <a href="/register">Join Us</a>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-cyber-400"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden border-t border-border">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        <a
                            href="/"
                            className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                        >
                            Home
                        </a>
                        <a
                            href="/about"
                            className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                        >
                            About
                        </a>
                        <a
                            href="/events"
                            className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                        >
                            Events
                        </a>
                        <a
                            href="/machines"
                            className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                        >
                            Machines
                        </a>
                        <a
                            href="/contact"
                            className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                        >
                            Contact
                        </a>

                        {isAuthenticated ? (
                            <>
                                <a
                                    href="/dashboard"
                                    className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                                >
                                    Dashboard
                                </a>
                                <a
                                    href="/profile"
                                    className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                                >
                                    Profile
                                </a>
                                {user?.role === 'admin' && (
                                    <a
                                        href="/admin"
                                        className="block px-3 py-2 text-gray-300 hover:text-cyber-400 transition-colors"
                                    >
                                        Admin Panel
                                    </a>
                                )}
                                <button
                                    onClick={logout}
                                    className="block w-full px-3 py-2 text-gray-300 hover:text-red-400 transition-colors text-left"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="px-3 py-2 space-y-2">
                                <a
                                    href="/login"
                                    className="block text-gray-300 hover:text-cyber-400 transition-colors"
                                >
                                    Login
                                </a>
                                <Button asChild variant="outline" size="sm" className="w-full border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black">
                                    <a href="/register">Join Us</a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}


