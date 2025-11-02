# Shopify Merchandise Store Setup Guide

This guide will help you set up the merchandise page with Shopify integration.

## Overview

The merchandise page uses **Shopify's Buy Button SDK** to display products directly on your site with full shopping cart functionality.

## Prerequisites

- A Shopify account (sign up at [shopify.com](https://www.shopify.com))
- A Shopify store set up with products
- Access to your Shopify admin panel

## Step 1: Set Up Your Shopify Store

1. **Create a Shopify account** (if you haven't already)
   - Go to [shopify.com](https://www.shopify.com)
   - Sign up for a free trial
   - Complete the store setup wizard

2. **Add products to your store**
   - Go to Products → Add product
   - Add product details (title, description, images, price, variants)
   - Save your products

3. **Create a collection** (optional but recommended)
   - Go to Products → Collections
   - Create a new collection (e.g., "XploitRUM Merchandise")
   - Add your products to this collection
   - Note down the collection URL from the browser address bar

## Step 2: Get Your Shopify Credentials

### Required Configuration

You need **3 environment variables** to enable the Buy Button SDK:

1. **Get your Store Domain**
   - Your store domain is in the format: `yourstore.myshopify.com`
   - Find it in Shopify Admin → Settings → Store details
   - Example: `xploitrum.myshopify.com`

2. **Create a Storefront API App**
   - Go to Shopify Admin → Settings → Apps and sales channels
   - Click **"Develop apps"**
   - Click **"Create an app"**
   - Name it "XploitRUM Storefront"

3. **Get your Storefront Access Token**
   - In your app settings, click **"API credentials"**
   - Under **"Storefront API"**, click **"Configure Storefront API scopes"**
   - Enable: `unauthenticated_read_product_listings`
   - Click **"Save"**
   - Go back and click **"Install app"**
   - **Copy the "Storefront access token"** (starts with `shpat_` or `shppa_`)
   - ⚠️ **Important:** You'll only see this token once! Save it immediately

4. **Get your Collection ID**
   - Go to Products → Collections
   - Click on your collection
   - Look at the URL: `https://admin.shopify.com/store/xxx/collections/COLLECTION_ID`
   - Copy the number at the end (the Collection ID)
   - OR use the collection handle (the URL-friendly name)

**Configure environment variables in `frontend/.env.local`:**
   ```env
   NEXT_PUBLIC_SHOPIFY_STORE_URL=yourstore.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_token_here
   NEXT_PUBLIC_SHOPIFY_COLLECTION_ID=123456789
   ```

## Step 3: Configure Your Application

1. **Copy the example environment file**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Edit `.env.local` and add your Shopify credentials**
   
   Add these three lines (replace with your actual values):
   ```env
   NEXT_PUBLIC_SHOPIFY_STORE_URL=yourstore.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_token_here
   NEXT_PUBLIC_SHOPIFY_COLLECTION_ID=123456789
   ```

3. **Restart your development server**
   ```bash
   npm run dev
   ```

## Step 4: Test Your Integration

1. **Visit your merchandise page**
   - Navigate to `http://localhost:3000/merch`
   - You should see your Shopify products embedded in the page

2. **Verify the following**
   - Products display correctly
   - Product images load properly
   - Add to cart functionality works
   - Checkout process works

## Step 5: Deploy to Production

1. **Add environment variables to your production environment**
   - If using Vercel: Add variables in Project Settings → Environment Variables
   - If using Docker: Add to your docker-compose.yml or deployment configuration
   - If using a VPS: Add to your production .env file

2. **Rebuild and deploy**
   ```bash
   npm run build
   npm run start
   ```

## Troubleshooting

### Products Not Showing

**Problem:** The merchandise page shows "Coming Soon" or no products.

**Solutions:**
- Verify your environment variables are set correctly
- Check that `NEXT_PUBLIC_` prefix is included
- Ensure your collection URL is publicly accessible
- Restart your development server after changing environment variables

### Access Token Not Working

**Problem:** Storefront API returns 401 or 403 errors.

**Solutions:**
- Verify your access token is correct
- Ensure the token has the right permissions
- Check that you're using a Storefront API token, not an Admin API token

### Collection Not Accessible

**Problem:** Collection iframe shows an error or is blank.

**Solutions:**
- Ensure your collection is published (not draft)
- Check that the collection URL is correct
- Verify products are added to the collection
- Make sure the collection is publicly accessible

### Styling Issues

**Problem:** Products don't match your site's style.

**Solutions:**
- The embedded iframe uses Shopify's theme
- Consider customizing your Shopify theme to match your brand
- Alternatively, use the Buy Button SDK for more control over styling

## Security Best Practices

1. **Never commit `.env.local` to git**
   - The `.env.example` file is meant to be a template only
   - Add `.env.local` to your `.gitignore`

2. **Use separate tokens for development and production**
   - Create different apps/tokens for each environment
   - Rotate tokens periodically

3. **Limit API permissions**
   - Only grant the minimum required permissions
   - Use Storefront API for client-side operations
   - Use Admin API only from secure backend services

## Additional Resources

- [Shopify Documentation](https://shopify.dev/docs)
- [Shopify Buy Button SDK](https://shopify.dev/docs/apps/custom-storefronts/buy-button)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Alternative: Using Printful

If you want to use Printful (print-on-demand) instead of Shopify:

1. Set up a Printful account
2. Connect it to your Shopify store
3. Use Printful products in your Shopify store
4. The integration remains the same as outlined above

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check your server logs for API errors
3. Verify your environment variables are correctly set
4. Consult the troubleshooting section above

For additional help, contact the development team or refer to the Shopify documentation.

