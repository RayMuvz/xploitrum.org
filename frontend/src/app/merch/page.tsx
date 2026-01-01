'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useRef } from 'react'

// Declare ShopifyBuy on window for TypeScript
declare global {
    interface Window {
        ShopifyBuy: any
    }
}

export default function MerchPage() {
    const shopifyCollectionUrl = process.env.NEXT_PUBLIC_SHOPIFY_COLLECTION_URL
    const shopifyStorefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
    const shopifyStoreUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL
    const shopifyCollectionId = process.env.NEXT_PUBLIC_SHOPIFY_COLLECTION_ID
    const buyButtonRef = useRef<HTMLDivElement>(null)
    const isInitializedRef = useRef(false) // Track if already initialized

    const resolvedCollectionId = useMemo(() => {
        if (shopifyCollectionId && shopifyCollectionId.trim().length > 0) {
            return shopifyCollectionId.trim()
        }

        if (shopifyCollectionUrl && shopifyCollectionUrl.trim().length > 0) {
            try {
                const url = new URL(
                    shopifyCollectionUrl.startsWith('http')
                        ? shopifyCollectionUrl
                        : `https://${shopifyCollectionUrl}`
                )
                const pathParts = url.pathname.split('/').filter(Boolean)
                const handle = pathParts[pathParts.length - 1]

                if (handle) {
                    return handle
                }
            } catch (error) {
                console.error('Invalid Shopify collection URL:', shopifyCollectionUrl, error)
            }
        }

        return undefined
    }, [shopifyCollectionId, shopifyCollectionUrl])

    // Check if Shopify is configured
    const isShopifyConfigured = Boolean(shopifyStoreUrl && shopifyStorefrontToken && resolvedCollectionId)

    useEffect(() => {
        if (!isShopifyConfigured || !buyButtonRef.current || isInitializedRef.current) return

        let cleanup: (() => void) | null = null

        const loadShopify = async () => {
            // Check if script is already loaded
            if (window.ShopifyBuy) {
                initShopify()
                return
            }

            // Load Shopify Buy Button SDK
        const script = document.createElement('script')
        script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js'
        script.async = true

            script.onload = () => {
                initShopify()
            }

        document.body.appendChild(script)

            cleanup = () => {
                if (document.body.contains(script)) {
            document.body.removeChild(script)
        }
            }
        }

        const initShopify = () => {
            if (!window.ShopifyBuy || !buyButtonRef.current || isInitializedRef.current) return

            // Mark as initialized
            isInitializedRef.current = true

            // Clear the container first to prevent duplicates
            buyButtonRef.current.innerHTML = ''

            const client = window.ShopifyBuy.buildClient({
                domain: shopifyStoreUrl!,
                storefrontAccessToken: shopifyStorefrontToken!,
            })

            const ui = window.ShopifyBuy.UI.init(client)

            if (resolvedCollectionId) {
                const collectionConfig: Record<string, string | number> = {}
                if (/^\d+$/.test(resolvedCollectionId)) {
                    collectionConfig.id = resolvedCollectionId
                } else {
                    collectionConfig.handle = resolvedCollectionId
                }

                ui.createComponent('collection', {
                    ...collectionConfig,
                    node: buyButtonRef.current,
                    options: {
                        collection: {
                            title: false,
                            productsPerPage: 48,
                            pagination: true,
                        },
                        product: {
                            contents: {
                                img: true,
                                title: true,
                                price: true,
                                variants: true,
                                buttonWithQuantity: false,
                                button: true,
                                quantity: true,
                            },
                            styles: {
                                product: {
                                    '@media (min-width: 601px)': {
                                        maxWidth: 'calc(33.333% - 30px)',
                                        marginLeft: '30px',
                                        marginBottom: '40px',
                                    },
                                },
                                title: {
                                    color: '#e0e0e0',
                                    fontSize: '18px',
                                },
                                price: {
                                    color: '#10b981',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                },
                                button: {
                                    'border-radius': '4px',
                                    'font-size': '16px',
                                    'padding': '12px 24px',
                                    'background-color': '#10b981',
                                    ':hover': {
                                        'background-color': '#059669',
                                    },
                                },
                            },
                        },
                        cart: {
                            startOpen: false,
                            popup: true, // Use popup for better UX, but inline on page
                            sticky: true,
                            contents: {
                                title: true,
                                note: true,
                            },
                            styles: {
                                button: {
                                    'border-radius': '4px',
                                    'background-color': '#10b981',
                                    ':hover': {
                                        'background-color': '#059669',
                                    },
                                },
                            },
                        },
                        toggle: {
                            contents: {
                                icon: true,
                            },
                            styles: {
                                toggle: {
                                    'background-color': '#10b981',
                                    ':hover': {
                                        'background-color': '#059669',
                                    },
                                },
                            },
                        },
                    },
                })
            } else {
                console.warn('Shopify collection identifier is missing. Please check your environment variables.')
            }
        }

        loadShopify()

        return () => {
            if (cleanup) cleanup()
            isInitializedRef.current = false
        }
    }, [
        isShopifyConfigured,
        resolvedCollectionId,
        shopifyStoreUrl,
        shopifyStorefrontToken,
        shopifyCollectionUrl,
        shopifyCollectionId,
    ])

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
                {/* Shopify Store Integration */}
                {isShopifyConfigured ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="cyber-border rounded-lg p-8 mb-12"
                    >
                        <h2 className="text-3xl font-bold text-white mb-6 text-center">
                            Our Merchandise
                        </h2>

                        {/* Shopify Buy Button Container */}
                        <div ref={buyButtonRef} className="shopify-buy-container w-full" />
                    </motion.div>
                ) : (
                    /* Fallback: Coming Soon Section */
                    <>
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

                        {/* Setup Instructions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                            className="cyber-border rounded-lg p-8 bg-gradient-to-br from-cyber-900/50 to-background"
                >
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Package className="h-8 w-8 text-cyber-400" />
                                Setup Required
                            </h3>
                            <div className="bg-gray-900 rounded-lg p-6 space-y-4">
                                <p className="text-gray-300 mb-4">
                                    To enable the merchandise store, configure the following environment variables in your <code className="text-cyber-400 bg-cyber-900 px-2 py-1 rounded">frontend/.env.local</code> file:
                        </p>
                                <div className="space-y-3">
                                    <div className="cyber-border rounded-lg p-4">
                                        <p className="text-cyber-400 font-semibold mb-2">Shopify Store URL</p>
                                        <code className="text-xs text-gray-300 block">
                                            NEXT_PUBLIC_SHOPIFY_STORE_URL=yourstore.myshopify.com
                            </code>
                                    </div>
                                    <div className="cyber-border rounded-lg p-4">
                                        <p className="text-cyber-400 font-semibold mb-2">Shopify Storefront Access Token</p>
                                        <code className="text-xs text-gray-300 block">
                                            NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_access_token
                            </code>
                                    </div>
                                    <div className="cyber-border rounded-lg p-4">
                                        <p className="text-cyber-400 font-semibold mb-2">Shopify Collection ID (optional)</p>
                                        <code className="text-xs text-gray-300 block">
                                            NEXT_PUBLIC_SHOPIFY_COLLECTION_ID=your_collection_id
                            </code>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-cyber-900/30 rounded-lg">
                                    <p className="text-sm text-cyber-400 font-semibold mb-2">📚 Documentation:</p>
                                    <ul className="text-sm text-gray-300 space-y-1 ml-4">
                                        <li>• See <code className="text-cyber-400">SHOPIFY_SETUP.md</code> for detailed setup instructions</li>
                                        <li>• Create a Shopify store at <a href="https://www.shopify.com" target="_blank" rel="noopener noreferrer" className="text-cyber-400 hover:underline">shopify.com</a></li>
                                        <li>• Get your Storefront Access Token from Shopify Admin → Settings → Apps and sales channels → Develop apps</li>
                                    </ul>
                        </div>
                    </div>
                </motion.div>
                    </>
                )}

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
                                Get notified when new merchandise becomes available
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
