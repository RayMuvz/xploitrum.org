'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Server, Zap, Shield, Clock, Users, Terminal } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function LabPage() {
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
                            XploitRUM <span className="text-cyber-400">Lab</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Deploy and manage your own isolated cybersecurity lab environment
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Coming Soon Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="cyber-border p-8 rounded-lg bg-card/50 mb-12 text-center"
                >
                    <Server className="h-16 w-16 mx-auto text-cyber-400 mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
                    <p className="text-gray-400 text-lg mb-6">
                        The XploitRUM Lab platform is currently under development.
                    </p>
                    <p className="text-gray-500">
                        Check back soon for our full-featured lab environment!
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="cyber-border p-6 rounded-lg bg-card/30"
                    >
                        <Server className="h-12 w-12 text-cyber-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Persistent Labs</h3>
                        <p className="text-gray-400">
                            Create and maintain long-running lab environments for extended practice and research.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="cyber-border p-6 rounded-lg bg-card/30"
                    >
                        <Zap className="h-12 w-12 text-cyber-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Quick Deploy</h3>
                        <p className="text-gray-400">
                            Instantly deploy pre-configured vulnerable machines and network scenarios.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="cyber-border p-6 rounded-lg bg-card/30"
                    >
                        <Shield className="h-12 w-12 text-cyber-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Isolated Networks</h3>
                        <p className="text-gray-400">
                            Practice in completely isolated network environments for safe learning.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="cyber-border p-6 rounded-lg bg-card/30"
                    >
                        <Clock className="h-12 w-12 text-cyber-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Flexible Duration</h3>
                        <p className="text-gray-400">
                            Choose lab session lengths that fit your schedule and learning pace.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="cyber-border p-6 rounded-lg bg-card/30"
                    >
                        <Users className="h-12 w-12 text-cyber-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Team Labs</h3>
                        <p className="text-gray-400">
                            Collaborate with team members in shared lab environments for group projects.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="cyber-border p-6 rounded-lg bg-card/30"
                    >
                        <Terminal className="h-12 w-12 text-cyber-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Full Access</h3>
                        <p className="text-gray-400">
                            Get complete root access to machines for comprehensive learning experiences.
                        </p>
                    </motion.div>
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="mt-12 text-center"
                >
                    <p className="text-gray-400 mb-4">
                        Interested in our lab platform? Contact us for early access!
                    </p>
                    <a
                        href="/contact"
                        className="inline-block px-8 py-3 bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold rounded hover:from-cyber-500 transition-all"
                    >
                        Get in Touch
                    </a>
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}

