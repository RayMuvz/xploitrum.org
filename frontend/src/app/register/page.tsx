'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Lock, Unlock, Send, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
    const [isLocked, setIsLocked] = useState(true)
    const [submitted, setSubmitted] = useState(false)

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        yearOfStudy: '',
        major: '',
        otherMajor: '',
        whyJoin: '',
        lookingForward: '',
        cybersecurityLevel: '',
        emailPrefix: '',
        studentNumber: '',
        phoneNumber: '',
    })

    // Check registration status from backend API or localStorage
    useEffect(() => {
        checkRegistrationStatus()
    }, [])

    const checkRegistrationStatus = async () => {
        try {
            // Try to fetch from backend API first (public endpoint)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/stats/registration-status`)
            if (response.ok) {
                const data = await response.json()
                setIsLocked(!data.enabled)
            } else {
                // Fallback to localStorage
                const registrationStatus = localStorage.getItem('xploitrum_registration_open')
                setIsLocked(registrationStatus !== 'true')
            }
        } catch (error) {
            console.error('Error checking registration status:', error)
            // Fallback to localStorage
            const registrationStatus = localStorage.getItem('xploitrum_registration_open')
            setIsLocked(registrationStatus !== 'true')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Create CSV format
        const csvData = `First Name,Last Name,Year of Study,Major,Why Join,Looking Forward,Cybersecurity Level,Email,Student Number,Phone Number
"${formData.firstName}","${formData.lastName}","${formData.yearOfStudy}","${formData.major === 'Other' ? formData.otherMajor : formData.major}","${formData.whyJoin}","${formData.lookingForward}","${formData.cybersecurityLevel}","${formData.emailPrefix}@upr.edu","${formData.studentNumber}","${formData.phoneNumber}"`

        // Send to API endpoint
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setSubmitted(true)
                // Reset form
                setFormData({
                    firstName: '',
                    lastName: '',
                    yearOfStudy: '',
                    major: '',
                    otherMajor: '',
                    whyJoin: '',
                    lookingForward: '',
                    cybersecurityLevel: '',
                    emailPrefix: '',
                    studentNumber: '',
                    phoneNumber: '',
                })
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                console.error('Registration failed:', errorData)
                // Backend returns { message } from HTTP exception handler; some endpoints use { detail }
                const errorMessage = errorData.message ?? errorData.detail ?? 'Please try again.'
                alert(`Registration failed: ${errorMessage}`)
            }
        } catch (error) {
            console.error('Registration failed:', error)
            alert('Registration failed. Please check your connection and try again.')
        }
    }

    /** Normalize email prefix: strip @upr.edu if user pasted full email */
    const normalizeEmailPrefix = (value: string) =>
        value.replace(/@upr\.edu$/i, '').trim().toLowerCase()

    const handleInputChange = (field: string, value: string) => {
        const normalized = field === 'emailPrefix' ? normalizeEmailPrefix(value) : value
        setFormData(prev => ({ ...prev, [field]: normalized }))
    }

    return (
        <main className="min-h-screen pt-16">
            <section className="py-24 cyber-bg">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Join <span className="text-cyber-400">XploitRUM</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Become part of our cybersecurity community
                        </p>
                    </motion.div>

                    {/* Locked State */}
                    {isLocked && !submitted ? (
                        <motion.div
                            className="cyber-border p-12 rounded-lg text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Lock className="h-16 w-16 text-cyber-400 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Registration Currently Closed
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Registration for new members is currently closed. Please check back later or
                                contact us for more information.
                            </p>
                            <Button
                                variant="outline"
                                className="border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                                asChild
                            >
                                <a href="/contact">Contact Us</a>
                            </Button>
                        </motion.div>
                    ) : submitted ? (
                        /* Success State */
                        <motion.div
                            className="cyber-border p-12 rounded-lg text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Registration Submitted!
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Thank you for your interest in joining XploitRUM! We've received your application
                                and will review it shortly. You should receive a confirmation email at your registered email address within a few minutes.
                            </p>
                            <Button
                                className="cyber-button"
                                onClick={() => setSubmitted(false)}
                            >
                                Submit Another Registration
                            </Button>
                        </motion.div>
                    ) : (
                        /* Registration Form */
                        <motion.div
                            className="cyber-border p-8 rounded-lg"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            First Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Last Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                {/* Year and Major */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Year of Study <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.yearOfStudy}
                                            onChange={(e) => handleInputChange('yearOfStudy', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        >
                                            <option value="">Select year...</option>
                                            <option value="1st">1st Year</option>
                                            <option value="2nd">2nd Year</option>
                                            <option value="3rd">3rd Year</option>
                                            <option value="4th">4th Year</option>
                                            <option value="5th+">5th Year and Up</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Major <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.major}
                                            onChange={(e) => handleInputChange('major', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        >
                                            <option value="">Select major...</option>
                                            <option value="ICOM">ICOM - Computer Engineering</option>
                                            <option value="INSO">INSO - Software Engineering</option>
                                            <option value="CIIC">CIIC - Computer Science</option>
                                            <option value="CISI">CISI - Computer Science & Information Systems</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Other Major (conditional) */}
                                {formData.major === 'Other' && (
                                    <div>
                                        <label className="block text-white font-medium mb-2">
                                            Please specify your major <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.otherMajor}
                                            onChange={(e) => handleInputChange('otherMajor', e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                            placeholder="Your major"
                                        />
                                    </div>
                                )}

                                {/* Why Join */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Why are you interested in joining XploitRUM? <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={formData.whyJoin}
                                        onChange={(e) => handleInputChange('whyJoin', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white resize-none"
                                        placeholder="Tell us about your interest in cybersecurity and XploitRUM..."
                                    />
                                </div>

                                {/* Looking Forward */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        What are you most looking forward to learning in cybersecurity? <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={formData.lookingForward}
                                        onChange={(e) => handleInputChange('lookingForward', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white resize-none"
                                        placeholder="Web security, penetration testing, cryptography, etc..."
                                    />
                                </div>

                                {/* Cybersecurity Level */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Current Cybersecurity Level <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.cybersecurityLevel}
                                        onChange={(e) => handleInputChange('cybersecurityLevel', e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                    >
                                        <option value="">Select level...</option>
                                        <option value="Beginner">Beginner - New to cybersecurity</option>
                                        <option value="Intermediate">Intermediate - Some experience</option>
                                        <option value="Pro">Pro - Advanced knowledge</option>
                                    </select>
                                </div>

                                {/* Institutional Email */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Institutional Email <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={formData.emailPrefix}
                                            onChange={(e) => handleInputChange('emailPrefix', e.target.value)}
                                            className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                            placeholder="john.doe"
                                        />
                                        <span className="text-gray-400 font-medium">@upr.edu</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Enter your UPR email (without @upr.edu)</p>
                                </div>

                                {/* Student Number */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Student Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.studentNumber}
                                        onChange={(e) => {
                                            // Format: XXX-XX-XXXX
                                            let value = e.target.value.replace(/\D/g, '')
                                            if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3)
                                            if (value.length > 6) value = value.slice(0, 6) + '-' + value.slice(6)
                                            if (value.length > 11) value = value.slice(0, 11)
                                            handleInputChange('studentNumber', value)
                                        }}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        placeholder="XXX-XX-XXXX"
                                        maxLength={11}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Format: XXX-XX-XXXX</p>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-white font-medium mb-2">
                                        Phone Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={(e) => {
                                            // Format: XXX-XXX-XXXX
                                            let value = e.target.value.replace(/\D/g, '')
                                            if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3)
                                            if (value.length > 7) value = value.slice(0, 7) + '-' + value.slice(7)
                                            if (value.length > 12) value = value.slice(0, 12)
                                            handleInputChange('phoneNumber', value)
                                        }}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                        placeholder="XXX-XXX-XXXX"
                                        maxLength={12}
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Format: XXX-XXX-XXXX</p>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full cyber-button group"
                                >
                                    Submit Registration
                                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <p className="text-sm text-gray-500 text-center">
                                    By submitting this form, you agree to our terms and conditions.
                                </p>
                            </form>
                        </motion.div>
                    )}
                </div>
            </section>
            <Footer />
        </main>
    )
}
