'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background pt-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <Shield className="h-16 w-16 mx-auto text-cyber-400 mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-400">Last updated: October 20, 2025</p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="prose prose-invert prose-lg max-w-none"
                >
                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <p className="text-gray-300 mb-4">
                            XploitRUM collects information that you provide directly to us when you:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Register for an account</li>
                            <li>Participate in CTF challenges</li>
                            <li>Attend events</li>
                            <li>Contact us through forms</li>
                        </ul>
                        <p className="text-gray-300 mt-4">
                            This information may include: name, email address, student number, university affiliation, 
                            phone number, and cybersecurity experience level.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-300 mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Provide and maintain our services</li>
                            <li>Process registrations for events and competitions</li>
                            <li>Send you important updates and notifications</li>
                            <li>Track your progress and maintain leaderboards</li>
                            <li>Improve our platform and user experience</li>
                            <li>Communicate about upcoming events and opportunities</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
                        <p className="text-gray-300">
                            We do not sell or share your personal information with third parties except:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>When required by law</li>
                            <li>With your explicit consent</li>
                            <li>To protect the rights and safety of XploitRUM and our users</li>
                            <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                        <p className="text-gray-300">
                            We implement appropriate technical and organizational measures to protect your personal 
                            information against unauthorized access, alteration, disclosure, or destruction. This includes:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Encrypted data transmission (HTTPS/TLS)</li>
                            <li>Secure password hashing</li>
                            <li>Regular security audits</li>
                            <li>Access controls and authentication</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">5. Cookies and Tracking</h2>
                        <p className="text-gray-300">
                            We use cookies and similar tracking technologies to maintain your session, 
                            remember your preferences, and analyze platform usage. You can control cookie 
                            settings through your browser.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
                        <p className="text-gray-300 mb-4">
                            You have the right to:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Object to certain data processing</li>
                            <li>Export your data</li>
                        </ul>
                        <p className="text-gray-300 mt-4">
                            To exercise these rights, please contact us at privacy@xploitrum.org
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">7. Children's Privacy</h2>
                        <p className="text-gray-300">
                            Our services are intended for university students and individuals 18 years or older. 
                            We do not knowingly collect information from children under 18.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
                        <p className="text-gray-300">
                            We may update this Privacy Policy from time to time. We will notify you of any 
                            changes by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20">
                        <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
                        <p className="text-gray-300 mb-4">
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Email: privacy@xploitrum.org</li>
                            <li>Website: <a href="/contact" className="text-cyber-400 hover:underline">xploitrum.org/contact</a></li>
                            <li>Address: Universidad de Puerto Rico, Mayagüez Campus</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}

