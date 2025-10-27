'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Mail, MapPin, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Custom Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.357.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.123.248.243.373.357a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
)

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
                                    <DiscordIcon className="h-6 w-6 text-cyber-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Discord</h4>
                                    <a 
                                        href="https://discord.gg/KXsWmfmS" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-cyber-400 hover:text-cyber-500 transition-colors"
                                    >
                                        Join our Discord community
                                    </a>
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
