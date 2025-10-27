'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Code, Users } from 'lucide-react'

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-bg pt-16">
            {/* Animated background grid */}
            <div className="absolute inset-0 cyber-grid opacity-30" />

            {/* Floating particles */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyber-400 rounded-full"
                        animate={{
                            x: [0, 100, 0],
                            y: [0, -100, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 10,
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        className="mb-8"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <img
                            src="/XPLOIT LOGO.png"
                            alt="XploitRUM Logo"
                            className="mx-auto max-w-[250px] w-full h-auto"
                        />
                    </motion.div>

                    <motion.p
                        className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        UPRM's Prime Cybersecurity Student Organization.
                        Learn, network, and grow your cybersecurity skills.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <Button
                            size="lg"
                            className="cyber-button group"
                            asChild
                        >
                            <a href="/events">
                                View Events
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                            asChild
                        >
                            <a href="/about">Learn More</a>
                        </Button>
                    </motion.div>

                    {/* Feature highlights */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                    >
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-500/20 rounded-full mb-4">
                                <Shield className="h-8 w-8 text-cyber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Organization</h3>
                            <p className="text-gray-400">
                                UPRM student organization devoted to fostering practical skills and professional development in the field of Cybersecurity.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-500/20 rounded-full mb-4">
                                <Code className="h-8 w-8 text-cyber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Real Challenges</h3>
                            <p className="text-gray-400">
                                Practice with real-world scenarios and cutting-edge techniques in our dedicated CTF machines.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-500/20 rounded-full mb-4">
                                <Users className="h-8 w-8 text-cyber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
                            <p className="text-gray-400">
                                Join a vibrant community of cybersecurity enthusiasts and students to develop your skills in the field of Cybersecurity.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
