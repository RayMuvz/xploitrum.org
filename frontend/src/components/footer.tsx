'use client'

import { Instagram, Linkedin, Mail } from 'lucide-react'

// Custom Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.357.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.123.248.243.373.357a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
)

export function Footer() {
    return (
        <footer className="bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-cyber-400 mb-4">XploitRUM</h3>
                        <p className="text-gray-400 text-sm">
                            Professional cybersecurity education and student organization at UPRM.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li><a href="/docs" className="text-gray-400 hover:text-cyber-400 transition-colors">Documentation</a></li>
                            <li><a href="/events" className="text-gray-400 hover:text-cyber-400 transition-colors">Events</a></li>
                            <li><a href="/merch" className="text-gray-400 hover:text-cyber-400 transition-colors">Merchandise</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Organization</h4>
                        <ul className="space-y-2">
                            <li><a href="/about" className="text-gray-400 hover:text-cyber-400 transition-colors">About Us</a></li>
                            <li><a href="/team" className="text-gray-400 hover:text-cyber-400 transition-colors">Team</a></li>
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
                            <a href="https://discord.gg/KXsWmfmS" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyber-400 transition-colors" title="Join our Discord server">
                                <DiscordIcon className="h-5 w-5" />
                            </a>
                            <a href="https://www.instagram.com/xploit.rum/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyber-400 transition-colors" title="Follow us on Instagram">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://www.linkedin.com/in/xploit-uprm-a54902394/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyber-400 transition-colors" title="Connect with us on LinkedIn">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="mailto:admin@xploitrum.org" className="text-gray-400 hover:text-cyber-400 transition-colors" title="Send us an email">
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
