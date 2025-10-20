'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Server, Terminal, Shield, Users, FileText, ExternalLink } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function DocsPage() {
    const sections = [
        {
            title: 'Getting Started',
            icon: BookOpen,
            items: [
                { name: 'Quick Start Guide', href: '#quick-start' },
                { name: 'Registration & Setup', href: '#registration' },
                { name: 'Your First Challenge', href: '#first-challenge' },
                { name: 'CTF Platform Overview', href: '#platform-overview' },
            ]
        },
        {
            title: 'CTF Platform',
            icon: Terminal,
            items: [
                { name: 'Deploying Instances', href: '#deploying' },
                { name: 'OpenVPN Connection', href: '#openvpn' },
                { name: 'Submitting Flags', href: '#flags' },
                { name: 'Scoring System', href: '#scoring' },
            ]
        },
        {
            title: 'Lab Environment',
            icon: Server,
            items: [
                { name: 'Lab Setup', href: '#lab-setup' },
                { name: 'Network Configuration', href: '#network' },
                { name: 'Tools & Resources', href: '#tools' },
                { name: 'Best Practices', href: '#best-practices' },
            ]
        },
        {
            title: 'Community',
            icon: Users,
            items: [
                { name: 'Events & Competitions', href: '/events' },
                { name: 'Team Collaboration', href: '#team' },
                { name: 'Discord Server', href: '#discord' },
                { name: 'Contributing', href: '#contributing' },
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-background pt-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            <span className="text-cyber-400">Documentation</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Everything you need to know to get started with XploitRUM
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Quick Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="cyber-border p-6 rounded-lg bg-card/30"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <section.icon className="h-8 w-8 text-cyber-400" />
                                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                            </div>
                            <ul className="space-y-2">
                                {section.items.map((item) => (
                                    <li key={item.name}>
                                        <a
                                            href={item.href}
                                            className="text-gray-400 hover:text-cyber-400 transition-colors flex items-center gap-2"
                                        >
                                            <span>→</span>
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Main Documentation Sections */}
                <div className="space-y-12">
                    {/* Quick Start */}
                    <motion.section
                        id="quick-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="cyber-border p-8 rounded-lg bg-card/20"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <BookOpen className="h-8 w-8 text-cyber-400" />
                            Quick Start Guide
                        </h2>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-400 mb-4">
                                Welcome to XploitRUM! Follow these steps to get started:
                            </p>
                            <ol className="text-gray-300 space-y-3">
                                <li><strong className="text-white">Register:</strong> Create your account or use the platform anonymously</li>
                                <li><strong className="text-white">Browse Challenges:</strong> Visit the CTF Platform to see available challenges</li>
                                <li><strong className="text-white">Deploy Instance:</strong> Click "Deploy Instance" on any active challenge</li>
                                <li><strong className="text-white">Access Machine:</strong> Go to "My Instances" tab and click "Access Machine"</li>
                                <li><strong className="text-white">Hack & Learn:</strong> Use the tools and techniques you've learned to find vulnerabilities</li>
                                <li><strong className="text-white">Submit Flag:</strong> Once you find the flag, submit it to earn points!</li>
                            </ol>
                        </div>
                    </motion.section>

                    {/* OpenVPN Setup */}
                    <motion.section
                        id="openvpn"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="cyber-border p-8 rounded-lg bg-card/20"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <Shield className="h-8 w-8 text-cyber-400" />
                            OpenVPN Connection
                        </h2>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-400 mb-4">
                                Connect to the XploitRUM network using OpenVPN:
                            </p>
                            <div className="bg-gray-900 p-4 rounded my-4">
                                <code className="text-cyber-400">
                                    # Download your config file from the Instances tab<br/>
                                    # Then connect using:<br/>
                                    sudo openvpn xploitrum.ovpn
                                </code>
                            </div>
                            <p className="text-gray-400">
                                Once connected, you can access your deployed instances directly via their IP addresses.
                            </p>
                        </div>
                    </motion.section>

                    {/* Tools & Resources */}
                    <motion.section
                        id="tools"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="cyber-border p-8 rounded-lg bg-card/20"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <Terminal className="h-8 w-8 text-cyber-400" />
                            Recommended Tools
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 p-4 rounded">
                                <h3 className="text-white font-semibold mb-2">Network Scanning</h3>
                                <ul className="text-gray-400 space-y-1">
                                    <li>• Nmap</li>
                                    <li>• Masscan</li>
                                    <li>• Netcat</li>
                                </ul>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded">
                                <h3 className="text-white font-semibold mb-2">Web Application</h3>
                                <ul className="text-gray-400 space-y-1">
                                    <li>• Burp Suite</li>
                                    <li>• OWASP ZAP</li>
                                    <li>• SQLMap</li>
                                </ul>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded">
                                <h3 className="text-white font-semibold mb-2">Password Cracking</h3>
                                <ul className="text-gray-400 space-y-1">
                                    <li>• John the Ripper</li>
                                    <li>• Hashcat</li>
                                    <li>• Hydra</li>
                                </ul>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded">
                                <h3 className="text-white font-semibold mb-2">Exploitation</h3>
                                <ul className="text-gray-400 space-y-1">
                                    <li>• Metasploit</li>
                                    <li>• ExploitDB</li>
                                    <li>• Custom Scripts</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    {/* Support */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="cyber-border p-8 rounded-lg bg-card/20 text-center"
                    >
                        <FileText className="h-16 w-16 mx-auto text-cyber-400 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
                        <p className="text-gray-400 mb-6">
                            Can't find what you're looking for? Reach out to our team!
                        </p>
                        <a
                            href="/contact"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold rounded hover:from-cyber-500 transition-all"
                        >
                            Contact Support
                        </a>
                    </motion.section>
                </div>
            </div>
            <Footer />
        </div>
    )
}

