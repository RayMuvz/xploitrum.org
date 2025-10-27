'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminRoute } from '@/contexts/AuthContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Users, Shield, User as UserIcon, X, Mail, AlertTriangle } from 'lucide-react'

interface User {
    id: number
    username: string
    email: string
    role: string
    status: string
    score: number
    created_at: string
    last_login: string | null
}

export default function UserManagementPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAddUser, setShowAddUser] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'user'
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const response = await fetch(`${apiUrl}/api/v1/admin/users?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch users')
            }

            const data = await response.json()
            setUsers(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch users.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleRole = async (userId: number, currentRole: string) => {
        try {
            setActionLoading(userId.toString())
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const newRole = currentRole === 'admin' ? 'user' : 'admin'

            const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to update role')
            }

            toast({
                title: "Role Updated",
                description: `User role changed to ${newRole}.`,
            })

            // Refresh the list
            fetchUsers()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update role.",
                variant: "destructive",
            })
        } finally {
            setActionLoading(null)
        }
    }

    const handleUpdateStatus = async (userId: number, currentStatus: string) => {
        try {
            setActionLoading(userId.toString())
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

            const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to update status')
            }

            toast({
                title: "Status Updated",
                description: `User status changed to ${newStatus}.`,
            })

            // Refresh the list
            fetchUsers()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update status.",
                variant: "destructive",
            })
        } finally {
            setActionLoading(null)
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newUser.username || !newUser.email || !newUser.password) {
            toast({
                title: "Missing information",
                description: "Please fill in username, email, and password.",
                variant: "destructive",
            })
            return
        }

        try {
            setActionLoading('creating')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const response = await fetch(`${apiUrl}/api/v1/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to create user')
            }

            toast({
                title: "User Created",
                description: `User ${newUser.username} has been created successfully.`,
            })

            // Reset form
            setNewUser({
                username: '',
                email: '',
                password: '',
                full_name: '',
                role: 'user'
            })
            setShowAddUser(false)

            // Refresh the list
            fetchUsers()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create user.",
                variant: "destructive",
            })
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!showDeleteConfirm) return

        try {
            setActionLoading(userId.toString())
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const authTokens = localStorage.getItem('auth_tokens')
            const token = authTokens ? JSON.parse(authTokens).access_token : ''

            const response = await fetch(`${apiUrl}/api/v1/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to delete user')
            }

            toast({
                title: "User Deleted",
                description: `User ${username} has been deleted successfully.`,
            })

            setShowDeleteConfirm(null)

            // Refresh the list
            fetchUsers()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete user.",
                variant: "destructive",
            })
        } finally {
            setActionLoading(null)
        }
    }

    const getRoleBadge = (role: string) => {
        if (role === 'admin') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/50 flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                </span>
            )
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyber-400/20 text-cyber-400 border border-cyber-400/50 flex items-center space-x-1">
                <UserIcon className="h-3 w-3" />
                <span>User</span>
            </span>
        )
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-500/20 text-green-400 border-green-500/50',
            inactive: 'bg-red-500/20 text-red-400 border-red-500/50',
            suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            banned: 'bg-red-600/20 text-red-500 border-red-600/50'
        }
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.active}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background pt-16">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                        User <span className="text-cyber-400">Management</span>
                                    </h1>
                                    <p className="text-xl text-gray-400">
                                        Manage user accounts and permissions
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowAddUser(!showAddUser)}
                                    className="bg-cyber-400 text-black hover:bg-cyber-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add User
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="cyber-border rounded-lg bg-background max-w-md w-full p-6"
                            >
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full">
                                    <AlertTriangle className="h-8 w-8 text-red-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white text-center mb-2">Delete User</h2>
                                <p className="text-gray-400 text-center mb-6">
                                    Are you sure you want to delete this user? This action cannot be undone and will permanently delete all associated data.
                                </p>
                                <div className="flex space-x-3">
                                    <Button
                                        onClick={() => setShowDeleteConfirm(null)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const userToDelete = users.find(u => u.id === showDeleteConfirm)
                                            if (userToDelete) {
                                                handleDeleteUser(showDeleteConfirm, userToDelete.username)
                                            }
                                        }}
                                        disabled={actionLoading === showDeleteConfirm?.toString()}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        {actionLoading === showDeleteConfirm?.toString() ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            'Delete User'
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Add User Modal */}
                    {showAddUser && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="cyber-border rounded-lg bg-background max-w-md w-full p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">Add New User</h2>
                                    <button
                                        onClick={() => setShowAddUser(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddUser} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400"
                                            placeholder="Enter username"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400"
                                            placeholder="user@example.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400"
                                            placeholder="Enter password"
                                            required
                                            minLength={8}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.full_name}
                                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-400"
                                            placeholder="Enter full name (optional)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Role *
                                        </label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyber-400"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button
                                            type="button"
                                            onClick={() => setShowAddUser(false)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={actionLoading === 'creating'}
                                            className="flex-1 bg-cyber-400 text-black hover:bg-cyber-500"
                                        >
                                            {actionLoading === 'creating' ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                            ) : (
                                                'Create User'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}

                    {/* Statistics */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="cyber-border rounded-lg p-6 text-center">
                            <Users className="h-8 w-8 text-cyber-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-white">{users.length}</p>
                            <p className="text-gray-400 text-sm">Total Users</p>
                        </div>
                        <div className="cyber-border rounded-lg p-6 text-center">
                            <Shield className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                            <p className="text-gray-400 text-sm">Admins</p>
                        </div>
                        <div className="cyber-border rounded-lg p-6 text-center">
                            <UserIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-white">{users.filter(u => u.status === 'active').length}</p>
                            <p className="text-gray-400 text-sm">Active</p>
                        </div>
                        <div className="cyber-border rounded-lg p-6 text-center">
                            <UserIcon className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-white">{users.filter(u => u.status !== 'active').length}</p>
                            <p className="text-gray-400 text-sm">Inactive</p>
                        </div>
                    </div>

                    {/* Users List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-400 mx-auto"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="cyber-border rounded-lg p-12 text-center">
                            <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
                            <p className="text-gray-400">No users registered yet.</p>
                        </div>
                    ) : (
                        <div className="cyber-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-cyber-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {users.map((userItem) => (
                                            <tr key={userItem.id} className="hover:bg-cyber-900/20">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-white">{userItem.username}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(userItem.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">{userItem.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getRoleBadge(userItem.role)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(userItem.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-cyber-400 font-semibold">{userItem.score}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleToggleRole(userItem.id, userItem.role)}
                                                            disabled={actionLoading === userItem.id.toString() || userItem.id === user?.id}
                                                            className="bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30"
                                                        >
                                                            {actionLoading === userItem.id.toString() ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400"></div>
                                                            ) : (
                                                                'Toggle Role'
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpdateStatus(userItem.id, userItem.status)}
                                                            disabled={actionLoading === userItem.id.toString() || userItem.id === user?.id}
                                                            className="bg-cyber-400/20 text-cyber-400 border border-cyber-400/50 hover:bg-cyber-400/30"
                                                        >
                                                            {actionLoading === userItem.id.toString() ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyber-400"></div>
                                                            ) : (
                                                                'Toggle Status'
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setShowDeleteConfirm(userItem.id)}
                                                            disabled={actionLoading === userItem.id.toString() || userItem.id === user?.id}
                                                            variant="destructive"
                                                            className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
}

