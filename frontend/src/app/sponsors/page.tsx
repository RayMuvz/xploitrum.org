'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Award, Heart, Zap, Target } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function SponsorsPage() {
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
                            Our <span className="text-cyber-400">Sponsors</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            Supporting cybersecurity education and innovation at RUM
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Thank You Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="cyber-border p-8 rounded-lg bg-card/50 mb-12 text-center"
                >
                    <Heart className="h-16 w-16 mx-auto text-cyber-400 mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-4">Thank You to Our Supporters</h2>
                    <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                        XploitRUM is made possible by the generous support of our sponsors, partners, and the RUM community. 
                        Your contributions help us provide cutting-edge cybersecurity education and resources to students.
                    </p>
                </motion.div>

                {/* Sponsorship Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="cyber-border p-8 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30"
                    >
                        <Award className="h-12 w-12 text-yellow-400 mb-4 mx-auto" />
                        <h3 className="text-2xl font-bold text-white text-center mb-4">Gold Sponsors</h3>
                        <div className="space-y-4">
                            <div className="cyber-border p-4 rounded bg-gray-900/50 text-center">
                                <p className="text-gray-400">Your Company Here</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="cyber-border p-8 rounded-lg bg-gradient-to-br from-gray-400/10 to-gray-500/10 border-gray-400/30"
                    >
                        <Zap className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
                        <h3 className="text-2xl font-bold text-white text-center mb-4">Silver Sponsors</h3>
                        <div className="space-y-4">
                            <div className="cyber-border p-4 rounded bg-gray-900/50 text-center">
                                <p className="text-gray-400">Your Company Here</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="cyber-border p-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30"
                    >
                        <Target className="h-12 w-12 text-orange-400 mb-4 mx-auto" />
                        <h3 className="text-2xl font-bold text-white text-center mb-4">Bronze Sponsors</h3>
                        <div className="space-y-4">
                            <div className="cyber-border p-4 rounded bg-gray-900/50 text-center">
                                <p className="text-gray-400">Your Company Here</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Become a Sponsor */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="cyber-border p-8 rounded-lg bg-card/30 text-center"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">Become a Sponsor</h2>
                    <p className="text-gray-400 mb-6 max-w-3xl mx-auto">
                        Support the next generation of cybersecurity professionals. Partner with XploitRUM to 
                        provide resources, mentorship, and opportunities to talented students at RUM.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/contact"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold rounded hover:from-cyber-500 transition-all"
                        >
                            Contact Us
                        </a>
                        <a
                            href="mailto:sponsors@xploitrum.org"
                            className="inline-block px-8 py-3 border-2 border-cyber-400 text-cyber-400 font-semibold rounded hover:bg-cyber-400 hover:text-black transition-all"
                        >
                            Email Sponsorship Team
                        </a>
                    </div>
                </motion.div>

                {/* Special Thanks */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-16 text-center"
                >
                    <h3 className="text-2xl font-bold text-white mb-4">Special Thanks</h3>
                    <p className="text-gray-400 mb-8">
                        Universidad de Puerto Rico - Recinto Universitario de Mayagüez<br/>
                        Department of Electrical and Computer Engineering<br/>
                        All our members and contributors
                    </p>
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}

