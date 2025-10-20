'use client'

import { motion } from 'framer-motion'
import { Shield, Code2, Trophy, Zap, Users, Lock } from 'lucide-react'

const features = [
    {
        icon: Shield,
        title: 'Hands On Learning',
        description: 'When you join Xploit RUM, you will be able to practice your skills in a secure and controlled environment.',
    },
    {
        icon: Code2,
        title: 'Real-World Challenges',
        description: 'Hands-on challenges covering web, crypto, pwn, reverse engineering, and more.',
    },
    {
        icon: Trophy,
        title: 'Competitive Learning',
        description: 'Compete on leaderboards, earn points, and showcase your cybersecurity skills.',
    },
    {
        icon: Zap,
        title: 'Instant Deployment',
        description: 'Deploy challenge instances with one click and access them immediately.',
    },
    {
        icon: Users,
        title: 'Community Driven',
        description: 'Learn together with fellow students and cybersecurity enthusiasts.',
    },
    {
        icon: Lock,
        title: 'VPN Access',
        description: 'Connect via OpenVPN for advanced challenges requiring network access.',
    },
]

export function FeaturesSection() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Why Choose <span className="text-cyber-400">XploitRUM</span>?
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        One of the leading cybersecurity student organizations in the University of Puerto Rico, Mayaguez campus.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="cyber-border p-8 rounded-lg"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-3 bg-cyber-500/20 rounded-lg">
                                    <feature.icon className="h-6 w-6 text-cyber-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
