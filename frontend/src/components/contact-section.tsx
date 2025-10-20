'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ContactSection() {
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/v1/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast({
                    title: "Message Sent!",
                    description: "We'll get back to you as soon as possible.",
                })
                setFormData({ name: '', email: '', message: '' })
            } else {
                const error = await response.json()
                toast({
                    title: "Failed to Send",
                    description: error.detail || "Please try again later",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Failed to Send",
                description: "Network error occurred",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="py-24 cyber-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Get In <span className="text-cyber-400">Touch</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Have questions? Want to join? Reach out to us!
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 className="text-2xl font-semibold text-white mb-6">Contact Information</h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-cyber-500/20 rounded-lg">
                                    <Mail className="h-6 w-6 text-cyber-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Email</h4>
                                    <p className="text-gray-400">admin@xploitrum.org</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-cyber-500/20 rounded-lg">
                                    <MapPin className="h-6 w-6 text-cyber-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Location</h4>
                                    <p className="text-gray-400">UPRM Campus, Stefani S-114A</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-cyber-500/20 rounded-lg">
                                    <Phone className="h-6 w-6 text-cyber-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Discord</h4>
                                    <p className="text-gray-400">Join our Discord community</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-white font-medium mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                    placeholder="Your name"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-white font-medium mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-white font-medium mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-cyber-400 text-white resize-none"
                                    placeholder="Your message..."
                                />
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full cyber-button group"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                                <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
