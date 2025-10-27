'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, ArrowLeft, Mail, Phone, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Member request form state
    const [showMemberRequest, setShowMemberRequest] = useState(false)
    const [memberRequestData, setMemberRequestData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        studentNumber: ''
    })
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

    const { login } = useAuth()
    const { toast } = useToast()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!username || !password) {
            toast({
                title: "Missing information",
                description: "Please fill in all fields.",
                variant: "destructive",
            })
            return
        }

        try {
            setIsLoading(true)
            await login(username, password)
            // Navigation is now handled in the AuthContext based on must_change_password flag
        } catch (error) {
            // Error is handled in the auth context
        } finally {
            setIsLoading(false)
        }
    }

    const handleMemberRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!memberRequestData.firstName || !memberRequestData.lastName || !memberRequestData.email) {
            toast({
                title: "Missing information",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        // Validate email domain
        if (!memberRequestData.email.endsWith('@upr.edu')) {
            toast({
                title: "Invalid email",
                description: "Email must be an institutional email (@upr.edu).",
                variant: "destructive",
            })
            return
        }

        try {
            setIsSubmittingRequest(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/member-requests/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: memberRequestData.firstName,
                    last_name: memberRequestData.lastName,
                    email: memberRequestData.email,
                    phone: memberRequestData.phone,
                    student_number: memberRequestData.studentNumber
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to submit request')
            }

            toast({
                title: "Request submitted",
                description: "Your member account request has been submitted successfully. You will receive an email when your request is reviewed.",
            })

            // Reset form
            setMemberRequestData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                studentNumber: ''
            })
            setShowMemberRequest(false)
        } catch (error: any) {
            toast({
                title: "Submission failed",
                description: error.message || "Failed to submit member request. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmittingRequest(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyber-900 flex items-center justify-center p-4 pt-24">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyber-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-neon-green rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="cyber-border p-8 rounded-lg bg-card/50 backdrop-blur-sm"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyber-400 to-neon-green rounded-full flex items-center justify-center">
                            {showMemberRequest ? <User className="h-8 w-8 text-black" /> : <Lock className="h-8 w-8 text-black" />}
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {showMemberRequest ? 'Request Member Account' : 'Welcome Back'}
                        </h1>
                        <p className="text-gray-400">
                            {showMemberRequest ? 'Request access to XploitRUM organization' : 'Sign in to your XploitRUM account'}
                        </p>
                    </div>

                    {/* Login Form - Show only if not requesting member account */}
                    {!showMemberRequest && (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Username Field */}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium text-gray-300">
                                        Username or Email
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="Enter your username or email"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium text-gray-300">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="Enter your password"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold py-3 rounded-lg hover:from-cyber-500 hover:to-neon-green/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                            Signing In...
                                        </div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </form>

                            {/* Toggle Button */}
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setShowMemberRequest(true)}
                                    className="text-cyber-400 hover:text-cyber-300 text-sm transition-colors"
                                >
                                    Request Member Account
                                </button>
                            </div>
                        </>
                    )}

                    {/* Member Request Form - Show instead of login form */}
                    {showMemberRequest && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <form onSubmit={handleMemberRequestSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                                        First Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="firstName"
                                            type="text"
                                            value={memberRequestData.firstName}
                                            onChange={(e) => setMemberRequestData({ ...memberRequestData, firstName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="Enter your first name"
                                            disabled={isSubmittingRequest}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                                        Last Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="lastName"
                                            type="text"
                                            value={memberRequestData.lastName}
                                            onChange={(e) => setMemberRequestData({ ...memberRequestData, lastName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="Enter your last name"
                                            disabled={isSubmittingRequest}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-300">
                                        Institutional Email (@upr.edu) *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={memberRequestData.email}
                                            onChange={(e) => {
                                                let value = e.target.value;
                                                // Auto-complete @upr.edu when user types @
                                                if (value.includes('@') && !value.includes('@upr.edu')) {
                                                    const localPart = value.split('@')[0];
                                                    if (!value.includes('.') && value.charAt(value.length - 1) === '@') {
                                                        value = localPart + '@upr.edu';
                                                    } else {
                                                        // Replace anything after @ with @upr.edu if not already there
                                                        value = localPart + '@upr.edu';
                                                    }
                                                }
                                                setMemberRequestData({ ...memberRequestData, email: value });
                                            }}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="your.name@upr.edu"
                                            disabled={isSubmittingRequest}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Must be a @upr.edu email address</p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-gray-300">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={memberRequestData.phone}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/[^\d]/g, '');
                                                if (value.length > 10) value = value.slice(0, 10);
                                                let formatted = value;
                                                if (value.length > 6) formatted = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
                                                else if (value.length > 3) formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                                                setMemberRequestData({ ...memberRequestData, phone: formatted });
                                            }}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="123-456-7890"
                                            disabled={isSubmittingRequest}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="studentNumber" className="text-sm font-medium text-gray-300">
                                        Student Number
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <input
                                            id="studentNumber"
                                            type="text"
                                            value={memberRequestData.studentNumber}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/[^\d]/g, '');
                                                if (value.length > 9) value = value.slice(0, 9);
                                                let formatted = value;
                                                if (value.length > 5) formatted = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`;
                                                else if (value.length > 3) formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                                                setMemberRequestData({ ...memberRequestData, studentNumber: formatted });
                                            }}
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400 focus:border-transparent transition-all"
                                            placeholder="123-45-6789"
                                            disabled={isSubmittingRequest}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmittingRequest}
                                    className="w-full bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold py-3 rounded-lg hover:from-cyber-500 hover:to-neon-green/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingRequest ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                            Submitting...
                                        </div>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </Button>

                                {/* Back to Login Button */}
                                <div className="text-center pt-2">
                                    <button
                                        onClick={() => setShowMemberRequest(false)}
                                        className="text-cyber-400 hover:text-cyber-300 text-sm transition-colors"
                                    >
                                        ← Back to Login
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
