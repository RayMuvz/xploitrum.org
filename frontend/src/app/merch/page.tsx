'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MerchPage() {
    useEffect(() => {
        // Load Shopify Buy Button SDK if available
        const script = document.createElement('script')
        script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js'
        script.async = true
        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    return (
        <div className="min-h-screen bg-background pt-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyber-900 via-background to-cyber-900 border-b border-cyber-400/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyber-400 to-neon-green rounded-full flex items-center justify-center">
                            <ShoppingBag className="h-10 w-10 text-black" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                            XploitRUM <span className="text-cyber-400">Merchandise</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Show your support for XploitRUM with our exclusive merchandise
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Featured Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="cyber-border rounded-lg p-12 mb-12 text-center"
                >
                    <Package className="h-16 w-16 text-cyber-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
                    <p className="text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
                        We're setting up our official merchandise store with high-quality items featuring the XploitRUM brand.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-gray-400">
                        <div className="cyber-border rounded-lg p-4 min-w-[150px]">
                            <p className="text-sm font-semibold text-cyber-400 mb-2">T-Shirts</p>
                            <p className="text-xs">High-quality cotton tees</p>
                        </div>
                        <div className="cyber-border rounded-lg p-4 min-w-[150px]">
                            <p className="text-sm font-semibold text-cyber-400 mb-2">Hoodies</p>
                            <p className="text-xs">Comfortable sweatshirts</p>
                        </div>
                        <div className="cyber-border rounded-lg p-4 min-w-[150px]">
                            <p className="text-sm font-semibold text-cyber-400 mb-2">Stickers</p>
                            <p className="text-xs">Custom vinyl stickers</p>
                        </div>
                        <div className="cyber-border rounded-lg p-4 min-w-[150px]">
                            <p className="text-sm font-semibold text-cyber-400 mb-2">Accessories</p>
                            <p className="text-xs">Mugs, bags & more</p>
                        </div>
                    </div>
                </motion.div>

                {/* Store Integration Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="cyber-border rounded-lg p-8"
                >
                    <h3 className="text-2xl font-bold text-white mb-6">Shop Integration</h3>
                    <div className="bg-gray-900 rounded-lg p-8 text-center">
                        <p className="text-gray-400 mb-4">
                            This section will display our integrated Shopify or Printful storefront.
                        </p>
                        <p className="text-sm text-gray-500">
                            Store configuration will be added via environment variables:
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <code className="bg-cyber-900 px-3 py-1 rounded text-xs text-cyber-400">
                                SHOPIFY_API_KEY
                            </code>
                            <code className="bg-cyber-900 px-3 py-1 rounded text-xs text-cyber-400">
                                SHOPIFY_STORE_URL
                            </code>
                            <code className="bg-cyber-900 px-3 py-1 rounded text-xs text-cyber-400">
                                PRINTFUL_API_KEY
                            </code>
                        </div>
                    </div>
                </motion.div>

                {/* Newsletter Signup */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-12 cyber-border rounded-lg p-8 bg-gradient-to-r from-cyber-900/50 to-background"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-2xl font-bold text-white mb-2">Be the First to Know</h3>
                            <p className="text-gray-400">
                                Get notified when our merchandise becomes available
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-cyber-400 to-neon-green text-black font-semibold hover:from-cyber-500 hover:to-neon-green/80">
                            Subscribe to Updates
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

