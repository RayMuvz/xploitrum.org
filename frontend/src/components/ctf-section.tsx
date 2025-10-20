'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Globe, Lock, Code, Cpu, FileSearch, Eye, Puzzle } from 'lucide-react'

const categories = [
    { icon: Globe, name: 'Web', count: 25, color: 'text-blue-400' },
    { icon: Lock, name: 'Crypto', count: 15, color: 'text-yellow-400' },
    { icon: Code, name: 'Pwn', count: 20, color: 'text-red-400' },
    { icon: Cpu, name: 'Reverse', count: 18, color: 'text-purple-400' },
    { icon: FileSearch, name: 'Forensics', count: 12, color: 'text-green-400' },
    { icon: Eye, name: 'OSINT', count: 10, color: 'text-orange-400' },
    { icon: Puzzle, name: 'Misc', count: 8, color: 'text-gray-400' },
]

export function CTFSection() {
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
                        CTF <span className="text-cyber-400">Challenges</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                        Explore a wide range of cybersecurity challenges designed to test and improve your skills
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
                    {categories.map((category, index) => (
                        <motion.div
                            key={index}
                            className="cyber-border p-6 rounded-lg text-center cursor-pointer"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            whileHover={{ scale: 1.1, y: -5 }}
                        >
                            <category.icon className={`h-8 w-8 mx-auto mb-3 ${category.color}`} />
                            <h3 className="text-white font-semibold mb-1">{category.name}</h3>
                            <p className="text-sm text-gray-500">{category.count} challenges</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Button
                        size="lg"
                        className="cyber-button"
                        asChild
                    >
                        <a href="/ctf">Browse All Challenges</a>
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}
