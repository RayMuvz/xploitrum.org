'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, Send, CheckCircle, Lock, Filter, X } from 'lucide-react'
import { ProtectedRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Footer } from '@/components/footer'
import { getStoredToken, getAuthHeaders } from '@/lib/auth'

interface PicoChallenge {
    id: number
    title: string
    category: string
    difficulty: string
    points: number
    is_solved: boolean
}

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'web_exploitation', label: 'Web Exploitation' },
    { value: 'reverse_engineering', label: 'Reverse Engineering' },
]

const DIFFICULTIES = [
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
]

function getDifficultyColor(d: string) {
    switch (d) {
        case 'easy': return 'text-green-400 bg-green-400/20'
        case 'medium': return 'text-yellow-400 bg-yellow-400/20'
        case 'hard': return 'text-red-400 bg-red-400/20'
        default: return 'text-gray-400 bg-gray-400/20'
    }
}

function CTFContent() {
    const { user, tokens } = useAuth()
    const { toast } = useToast()
    const [challenges, setChallenges] = useState<PicoChallenge[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('')
    const [difficulty, setDifficulty] = useState('')
    const [submitModal, setSubmitModal] = useState<{ challenge: PicoChallenge } | null>(null)
    const [flagInput, setFlagInput] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const authToken = tokens?.access_token ?? getStoredToken()
    const authHeaders = getAuthHeaders(authToken)

    const fetchChallenges = async () => {
        if (!authToken) return
        try {
            const params = new URLSearchParams()
            if (category) params.set('category', category)
            if (difficulty) params.set('difficulty', difficulty)
            const res = await fetch(`/api/pico/challenges?${params}`, {
                headers: authHeaders,
            })
            if (res.ok) {
                const data = await res.json()
                setChallenges(data)
            } else {
                toast({ title: 'Error', description: 'Failed to load challenges', variant: 'destructive' })
            }
        } catch (e) {
            console.error(e)
            toast({ title: 'Error', description: 'Failed to load challenges', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authToken) {
            setLoading(false)
            return
        }
        fetchChallenges()
    }, [category, difficulty, authToken])

    const handleSubmitFlag = async () => {
        if (!submitModal || !authToken) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/pico/challenges/${submitModal.challenge.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({ flag: flagInput }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok && data.correct) {
                toast({
                    title: 'Correct!',
                    description: data.message || `+${submitModal.challenge.points} point(s)`,
                })
                setSubmitModal(null)
                setFlagInput('')
                fetchChallenges()
            } else {
                toast({
                    title: 'Incorrect',
                    description: data.message || 'Wrong flag. Try again.',
                    variant: 'destructive',
                })
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Submission failed', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            <span className="text-cyber-400">picoCTF</span> Challenges
                        </h1>
                        <p className="text-gray-400">Submit flags from picoCTF. +1 point per correct flag.</p>
                        {user && (
                            <p className="mt-2 text-cyber-400 font-semibold">
                                Your score: {user.score} pts · {user.total_solves} solves
                            </p>
                        )}
                    </motion.div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-card border border-border rounded px-3 py-2 text-white"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value || 'all'} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="bg-card border border-border rounded px-3 py-2 text-white"
                        >
                            {DIFFICULTIES.map((d) => (
                                <option key={d.value || 'all'} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400" />
                    </div>
                ) : challenges.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">No challenges match your filters.</p>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="cyber-border rounded-lg bg-card/50 p-6 flex flex-col"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                                    {c.is_solved && (
                                        <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    <span className="text-xs px-2 py-1 rounded bg-cyber-400/20 text-cyber-400">
                                        {c.category.replace(/_/g, ' ')}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(c.difficulty)}`}>
                                        {c.difficulty}
                                    </span>
                                    <span className="text-xs text-gray-500">{c.points} pt{c.points !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="mt-4 flex-1" />
                                <Button
                                    onClick={() => {
                                        setSubmitModal({ challenge: c })
                                        setFlagInput('')
                                    }}
                                    disabled={c.is_solved}
                                    className="mt-4 w-full border-cyber-400 text-cyber-400 hover:bg-cyber-400 hover:text-black"
                                >
                                    {c.is_solved ? (
                                        <>Solved <CheckCircle className="h-4 w-4 ml-2" /></>
                                    ) : (
                                        <>Submit Flag <Send className="h-4 w-4 ml-2" /></>
                                    )}
                                </Button>
                            </motion.div>
                        ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Submit modal */}
            <AnimatePresence>
                {submitModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
                        onClick={() => !submitting && setSubmitModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-cyber-400/30 rounded-lg p-6 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-white">Submit Flag</h3>
                                <button
                                    onClick={() => !submitting && setSubmitModal(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{submitModal.challenge.title}</p>
                            <input
                                type="text"
                                value={flagInput}
                                onChange={(e) => setFlagInput(e.target.value)}
                                placeholder="picoctf{flag_here}"
                                className="w-full px-4 py-3 bg-background border border-border rounded text-white placeholder-gray-500 mb-4"
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSubmitFlag}
                                    disabled={submitting}
                                    className="flex-1 bg-cyber-400 text-black hover:bg-cyber-300"
                                >
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => !submitting && setSubmitModal(null)}
                                    className="border-gray-600 text-gray-300"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    )
}

export default function CTFPage() {
    return (
        <ProtectedRoute>
            <CTFContent />
        </ProtectedRoute>
    )
}
