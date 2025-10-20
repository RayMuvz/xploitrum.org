'use client'

import { motion } from 'framer-motion'
import { Target, Lightbulb, GraduationCap, Globe } from 'lucide-react'

export function AboutSection() {
    return (
        <section className="py-24 cyber-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            About <span className="text-cyber-400">XploitRUM</span>
                        </h2>
                        <p className="text-lg text-gray-300 mb-6">
                            XploitRUM is a premier cybersecurity student organization dedicated to fostering
                            practical skills, ethical hacking knowledge, and professional development in the
                            field of information security.
                        </p>
                        <p className="text-lg text-gray-300 mb-8">
                            Our platform combines cutting-edge technology with hands-on learning experiences,
                            providing students with real-world challenges and a competitive environment to
                            sharpen their skills.
                        </p>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-3xl font-bold text-cyber-400 mb-2">37+</div>
                                <div className="text-gray-400">Active Members</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-neon-green mb-2">2+</div>
                                <div className="text-gray-400">CTF Challenges</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-cyber-400 mb-2">1</div>
                                <div className="text-gray-400">Events Hosted</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-neon-green mb-2">24/7</div>
                                <div className="text-gray-400">Platform Access</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="cyber-border p-6 rounded-lg">
                            <Target className="h-8 w-8 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Our Mission</h3>
                            <p className="text-gray-400">
                                To empower the next generation of cybersecurity professionals through
                                practical education, ethical hacking challenges, and community collaboration.
                            </p>
                        </div>

                        <div className="cyber-border p-6 rounded-lg">
                            <Lightbulb className="h-8 w-8 text-neon-green mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Our Vision</h3>
                            <p className="text-gray-400">
                                To become the leading platform for cybersecurity education and skill
                                development, recognized globally for excellence and innovation.
                            </p>
                        </div>

                        <div className="cyber-border p-6 rounded-lg">
                            <GraduationCap className="h-8 w-8 text-cyber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Our Values</h3>
                            <p className="text-gray-400">
                                Ethics, continuous learning, community support, and practical application
                                of cybersecurity principles in real-world scenarios.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
