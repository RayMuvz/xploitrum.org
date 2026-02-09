'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flag, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { AdminRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { getStoredToken, getAuthHeaders } from '@/lib/auth'

interface PicoChallengeAdmin {
    id: number
    title: string
    category: string
    difficulty: string
    flag_pattern: string
    points: number
    display_order: number
    created_at: string | null
}

const CATEGORIES = [
    { value: 'web_exploitation', label: 'Web Exploitation' },
    { value: 'reverse_engineering', label: 'Reverse Engineering' },
]

const DIFFICULTIES = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
]

const emptyForm = {
    title: '',
    category: 'web_exploitation',
    difficulty: 'easy',
    flag_pattern: '',
    points: 1,
    display_order: 0,
}

export default function AdminPicoChallengesPage() {
    const { user, tokens } = useAuth()
    const { toast } = useToast()
    const [challenges, setChallenges] = useState<PicoChallengeAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formData, setFormData] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

    const authHeaders = getAuthHeaders(tokens?.access_token ?? getStoredToken())

    const fetchChallenges = async () => {
        try {
            const res = await fetch('/api/pico/admin/challenges', {
                headers: authHeaders,
            })
            if (res.ok) {
                const data = await res.json()
                setChallenges(data)
            } else {
                toast({ title: 'Error', description: 'Failed to load challenges', variant: 'destructive' })
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to load challenges', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchChallenges()
    }, [])

    const handleCreate = () => {
        setEditingId(null)
        // Default display_order to last position (one more than current max)
        const lastOrder = challenges.length
            ? Math.max(...challenges.map((c) => c.display_order)) + 1
            : 0
        setFormData({ ...emptyForm, display_order: lastOrder })
        setShowForm(true)
    }

    const handleEdit = (c: PicoChallengeAdmin) => {
        setEditingId(c.id)
        setFormData({
            title: c.title,
            category: c.category,
            difficulty: c.difficulty,
            flag_pattern: c.flag_pattern,
            points: c.points,
            display_order: c.display_order,
        })
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.flag_pattern.trim()) {
            toast({ title: 'Validation', description: 'Title and flag pattern are required', variant: 'destructive' })
            return
        }
        setSaving(true)
        try {
            const url = editingId
                ? `/api/pico/admin/challenges/${editingId}`
                : '/api/pico/admin/challenges'
            const method = editingId ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify(formData),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast({ title: editingId ? 'Updated' : 'Created', description: 'Challenge saved' })
                setShowForm(false)
                setEditingId(null)
                setFormData(emptyForm)
                fetchChallenges()
            } else {
                toast({ title: 'Error', description: data.detail || data.message || 'Save failed', variant: 'destructive' })
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Save failed', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/pico/admin/challenges/${id}`, {
                method: 'DELETE',
                headers: authHeaders,
            })
            if (res.ok) {
                toast({ title: 'Deleted', description: 'Challenge removed' })
                setDeleteConfirm(null)
                fetchChallenges()
            } else {
                toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' })
        }
    }

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background pt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Admin</Link>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Flag className="h-8 w-8 text-cyber-400" />
                                picoCTF Challenges
                            </h1>
                        </div>
                        <Button onClick={handleCreate} className="bg-cyber-400 text-black hover:bg-cyber-500">
                            <Plus className="h-4 w-4 mr-2" /> Add Challenge
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {challenges.map((c) => (
                                <motion.div
                                    key={c.id}
                                    className="cyber-border rounded-lg p-4 bg-card/50 flex items-center justify-between flex-wrap gap-4"
                                >
                                    <div>
                                        <h3 className="font-semibold text-white">{c.title}</h3>
                                        <div className="flex gap-2 mt-1 text-sm">
                                            <span className="text-cyber-400">{c.category.replace(/_/g, ' ')}</span>
                                            <span className="text-gray-500">·</span>
                                            <span className="text-gray-400">{c.difficulty}</span>
                                            <span className="text-gray-500">·</span>
                                            <span className="text-gray-500">{c.points} pt{c.points !== 1 ? 's' : ''}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1 font-mono truncate max-w-md">{c.flag_pattern}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(c)} className="border-cyber-400 text-cyber-400">
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                        {deleteConfirm === c.id ? (
                                            <>
                                                <span className="text-sm text-red-400">Delete?</span>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>Yes</Button>
                                                <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>No</Button>
                                            </>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(c.id)} className="border-red-400/50 text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Create/Edit modal */}
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => !saving && setShowForm(false)}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-card border border-cyber-400/30 rounded-lg p-6 w-full max-w-md"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-white">{editingId ? 'Edit Challenge' : 'Add Challenge'}</h2>
                                    <button onClick={() => !saving && setShowForm(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                                        <input
                                            value={formData.title}
                                            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                                            className="w-full px-4 py-2 bg-background border border-border rounded text-white"
                                            placeholder="Challenge name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                                            className="w-full px-4 py-2 bg-background border border-border rounded text-white"
                                        >
                                            {CATEGORIES.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData((f) => ({ ...f, difficulty: e.target.value }))}
                                            className="w-full px-4 py-2 bg-background border border-border rounded text-white"
                                        >
                                            {DIFFICULTIES.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Flag pattern (* = any alphanumeric)</label>
                                        <input
                                            value={formData.flag_pattern}
                                            onChange={(e) => setFormData((f) => ({ ...f, flag_pattern: e.target.value }))}
                                            className="w-full px-4 py-2 bg-background border border-border rounded text-white font-mono text-sm"
                                            placeholder="picoCTF{example_*}"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Points</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={formData.points}
                                                onChange={(e) => setFormData((f) => ({ ...f, points: parseInt(e.target.value, 10) || 1 }))}
                                                className="w-full px-4 py-2 bg-background border border-border rounded text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Display order</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={formData.display_order}
                                                onChange={(e) => setFormData((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
                                                className="w-full px-4 py-2 bg-background border border-border rounded text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <Button onClick={handleSave} disabled={saving} className="flex-1 bg-cyber-400 text-black">
                                        <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button variant="outline" onClick={() => !saving && setShowForm(false)}>Cancel</Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
}
