'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function TermsPage() {
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
                        <FileText className="h-16 w-16 mx-auto text-cyber-400 mb-4" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Terms of Service
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
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-300">
                            By accessing and using the XploitRUM platform, you accept and agree to be bound by these
                            Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">2. Educational Purpose</h2>
                        <p className="text-gray-300 mb-4">
                            XploitRUM is an educational platform designed to teach cybersecurity concepts in a legal
                            and controlled environment. Users agree to:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Use the platform solely for educational purposes</li>
                            <li>Not attempt to attack or compromise systems outside of designated challenges</li>
                            <li>Respect the infrastructure and other users</li>
                            <li>Follow responsible disclosure practices</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">3. Account Responsibilities</h2>
                        <p className="text-gray-300 mb-4">
                            When you create an account, you agree to:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Notify us immediately of any unauthorized access</li>
                            <li>Accept responsibility for all activities under your account</li>
                            <li>Not share your account with others</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use Policy</h2>
                        <p className="text-gray-300 mb-4">
                            You agree NOT to:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Attack or attempt to compromise the platform infrastructure</li>
                            <li>Interfere with other users' access to challenges</li>
                            <li>Share flags or solutions publicly</li>
                            <li>Use automated tools to gain unfair advantages</li>
                            <li>Upload malicious content or malware</li>
                            <li>Harass, threaten, or abuse other users</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">5. Challenge Rules</h2>
                        <p className="text-gray-300 mb-4">
                            When participating in CTF challenges:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Only attack the specific target machines provided</li>
                            <li>Do not deny service to other users</li>
                            <li>Submit only flags you have legitimately obtained</li>
                            <li>Report any platform bugs or vulnerabilities responsibly</li>
                            <li>Respect challenge time limits and resource constraints</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property</h2>
                        <p className="text-gray-300">
                            All content on XploitRUM, including challenges, documentation, and platform code,
                            is the property of XploitRUM or its content creators. You may not reproduce,
                            distribute, or create derivative works without permission.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimer of Warranties</h2>
                        <p className="text-gray-300">
                            The platform is provided "as is" without warranties of any kind. We do not guarantee
                            uninterrupted access, error-free operation, or that the platform will meet your specific requirements.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                        <p className="text-gray-300">
                            XploitRUM and its operators shall not be liable for any indirect, incidental, special,
                            or consequential damages arising from your use of the platform.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
                        <p className="text-gray-300 mb-4">
                            We reserve the right to:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Suspend or terminate accounts that violate these terms</li>
                            <li>Remove content that violates our policies</li>
                            <li>Modify or discontinue services at any time</li>
                            <li>Ban users who engage in malicious activities</li>
                        </ul>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">10. Governing Law</h2>
                        <p className="text-gray-300">
                            These Terms of Service are governed by the laws of Puerto Rico and the United States.
                            Any disputes shall be resolved in the courts of Puerto Rico.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
                        <p className="text-gray-300">
                            We may modify these terms at any time. Continued use of the platform after changes
                            constitutes acceptance of the new terms.
                        </p>
                    </div>

                    <div className="cyber-border p-8 rounded-lg bg-card/20">
                        <h2 className="text-2xl font-bold text-white mb-4">12. Contact Information</h2>
                        <p className="text-gray-300 mb-4">
                            For questions about these Terms of Service, contact:
                        </p>
                        <ul className="text-gray-300 space-y-2">
                            <li>Email: admin@xploitrum.org</li>
                            <li>Website: <a href="/contact" className="text-cyber-400 hover:underline">xploitrum.org/contact</a></li>
                            <li>Organization: XploitRUM - UPRM Cybersecurity Student Organization</li>
                        </ul>
                    </div>

                    <div className="mt-8 p-6 bg-cyber-400/10 border-l-4 border-cyber-400 rounded">
                        <p className="text-white font-semibold mb-2">By using XploitRUM, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
                        <p className="text-gray-400">Happy Hacking! 🔐</p>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}

