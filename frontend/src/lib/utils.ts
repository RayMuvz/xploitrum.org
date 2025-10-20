import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export function formatDateTime(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatTimeRemaining(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
    } else {
        return `${secs}s`
    }
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return 'text-green-400'
        case 'medium':
            return 'text-yellow-400'
        case 'hard':
            return 'text-red-400'
        case 'expert':
            return 'text-purple-400'
        default:
            return 'text-gray-400'
    }
}

export function getCategoryColor(category: string): string {
    switch (category.toLowerCase()) {
        case 'web':
            return 'text-blue-400'
        case 'crypto':
            return 'text-yellow-400'
        case 'pwn':
            return 'text-red-400'
        case 'reverse':
            return 'text-purple-400'
        case 'forensics':
            return 'text-green-400'
        case 'osint':
            return 'text-orange-400'
        case 'misc':
            return 'text-gray-400'
        case 'ml':
            return 'text-pink-400'
        case 'mobile':
            return 'text-indigo-400'
        case 'network':
            return 'text-cyan-400'
        default:
            return 'text-gray-400'
    }
}

export function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

export function generateRandomId(): string {
    return Math.random().toString(36).substr(2, 9)
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}
