'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

const team = [
    {
        name: 'Christian Rios',
        role: 'President & Founder',
        year: '6th year ICOM',
        bio: 'Over 5+ cybersecurity positions in the past 3 years. Penetration Tester, Reverse Engineer and Overall Cybersecurity Engineer',
    },
    {
        name: 'Osvaldo Figueroa',
        role: 'Vice-President',
        year: '4th year INSO',
        bio: 'Interest in Penetration Testing and Ethical hacking',
    },
    {
        name: 'Jan Rodriguez',
        role: 'Secretary',
        year: '4th year SICI',
        bio: 'Interest in Network Pentesting and Information Technologies',
    },
    {
        name: 'Reymarie Algarín',
        role: 'Treasurer',
        year: '6th year INSO',
        bio: 'Interest in overall cybersecurity',
    },
    {
        name: 'Naimarys Barbot',
        role: 'Social Media Manager',
        year: '1st year Marketing',
        bio: 'Interest in overall cybersecurity',
    },
    {
        name: 'Xamyl Rios',
        role: 'Vocal',
        year: '1st year ICOM',
        bio: 'Interest in Penetration testing and Ethical hacking',
    },
]

export function TeamSection() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    const nextSlide = () => {
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % team.length)
    }

    const prevSlide = () => {
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + team.length) % team.length)
    }

    const goToSlide = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1)
        setCurrentIndex(index)
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide()
            if (e.key === 'ArrowRight') nextSlide()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex])

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.95,
        }),
    }

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
                        Meet Our <span className="text-cyber-400">Student Council</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Passionate cybersecurity enthusiasts leading XploitRUM
                    </p>
                </motion.div>

                {/* Carousel Container */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Carousel Content */}
                    <div className="relative h-[500px] md:h-[400px] overflow-hidden">
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 100, damping: 25 },
                                    opacity: { duration: 0.5 },
                                    scale: { duration: 0.5 },
                                }}
                                className="absolute w-full"
                            >
                                <div className="cyber-border p-8 md:p-12 rounded-lg">
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="w-40 h-40 rounded-full bg-gradient-to-r from-cyber-400 to-neon-green p-1">
                                                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                                                    <div className="text-6xl text-cyber-400">👤</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-3xl font-bold text-white mb-2">
                                                {team[currentIndex].name}
                                            </h3>
                                            <p className="text-xl text-cyber-400 font-semibold mb-2">
                                                {team[currentIndex].role}
                                            </p>
                                            <p className="text-md text-gray-300 mb-4">
                                                {team[currentIndex].year}
                                            </p>
                                            <p className="text-gray-400 leading-relaxed">
                                                {team[currentIndex].bio}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Arrows - Clean arrows outside the card */}
                    <button
                        onClick={prevSlide}
                        className="absolute -left-16 md:-left-20 top-1/2 -translate-y-1/2 p-2 text-cyber-400 hover:text-cyber-300 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        aria-label="Previous team member"
                    >
                        <ChevronLeft className="h-10 w-10" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute -right-16 md:-right-20 top-1/2 -translate-y-1/2 p-2 text-cyber-400 hover:text-cyber-300 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        aria-label="Next team member"
                    >
                        <ChevronRight className="h-10 w-10" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-3 mt-8">
                        {team.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all ${index === currentIndex
                                    ? 'w-8 h-3 bg-cyber-400'
                                    : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
                                    } rounded-full`}
                                aria-label={`Go to team member ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Counter */}
                    <div className="text-center mt-4">
                        <p className="text-gray-500 text-sm">
                            {currentIndex + 1} / {team.length}
                        </p>
                    </div>
                </div>

                {/* Navigation hint */}
                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        ← Use arrow buttons or keyboard to navigate →
                    </p>
                </div>
            </div>
        </section>
    )
}
