'use client'

import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-cyber-400 mb-4">XploitRUM</h3>
                        <p className="text-gray-400 text-sm">
                            Professional cybersecurity education and CTF platform for students and enthusiasts.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Platform</h4>
                        <ul className="space-y-2">
                            <li><a href="/ctf" className="text-gray-400 hover:text-cyber-400 transition-colors">Challenges</a></li>
                            <li><a href="/lab" className="text-gray-400 hover:text-cyber-400 transition-colors">Lab</a></li>
                            <li><a href="/leaderboard" className="text-gray-400 hover:text-cyber-400 transition-colors">Leaderboard</a></li>
                            <li><a href="/docs" className="text-gray-400 hover:text-cyber-400 transition-colors">Documentation</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Organization</h4>
                        <ul className="space-y-2">
                            <li><a href="/about" className="text-gray-400 hover:text-cyber-400 transition-colors">About Us</a></li>
                            <li><a href="/team" className="text-gray-400 hover:text-cyber-400 transition-colors">Team</a></li>
                            <li><a href="/events" className="text-gray-400 hover:text-cyber-400 transition-colors">Events</a></li>
                            <li><a href="/sponsors" className="text-gray-400 hover:text-cyber-400 transition-colors">Sponsors</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Connect</h4>
                        <ul className="space-y-2 mb-4">
                            <li><a href="/contact" className="text-gray-400 hover:text-cyber-400 transition-colors">Contact</a></li>
                            <li><a href="/privacy" className="text-gray-400 hover:text-cyber-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="text-gray-400 hover:text-cyber-400 transition-colors">Terms of Service</a></li>
                        </ul>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-cyber-400 transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-cyber-400 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-cyber-400 transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="mailto:admin@xploitrum.org" className="text-gray-400 hover:text-cyber-400 transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} XploitRUM. All rights reserved.
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Built with Next.js, FastAPI, and Docker
                    </p>
                </div>
            </div>
        </footer>
    )
}
