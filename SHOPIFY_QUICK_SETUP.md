# Quick Setup: Shoppable Merchandise Page

Your merchandise page is now configured to display products **directly on your site** with full shopping cart functionality!

## ✅ What's Implemented

- **Shopify Buy Button SDK** integration
- Products displayed in a grid layout
- Add to cart without leaving your site
- Secure checkout powered by Shopify
- Styled to match your cyber theme

---

## 🔧 Required Setup

You need **3 environment variables** in `frontend/.env.local`:

### 1. Store URL
```env
NEXT_PUBLIC_SHOPIFY_STORE_URL=xploitrum.myshopify.com
```
Your Shopify store domain (without https://)

### 2. Storefront Access Token
```env
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
```
Get this from Shopify Admin → Settings → Apps → Develop apps

### 3. Collection ID
```env
NEXT_PUBLIC_SHOPIFY_COLLECTION_ID=123456789
```
Numeric ID of your collection

---

## 📋 Step-by-Step Setup

### Step 1: Get Store Domain
1. Log into Shopify Admin
2. Go to Settings → Store details
3. Copy your store domain
4. Should look like: `xploitrum.myshopify.com`

### Step 2: Create Storefront API App
1. Shopify Admin → Settings → Apps and sales channels
2. Click **"Develop apps"**
3. Click **"Create an app"**
4. Name it: "XploitRUM Storefront"
5. Click **"Create app"**

### Step 3: Get Access Token
1. In your app, click **"API credentials"**
2. Under **"Storefront API"**, click **"Configure Storefront API scopes"**
3. Enable: `unauthenticated_read_product_listings`
4. Click **"Save"**
5. Go back and click **"Install app"** button
6. **Copy the token** (starts with `shpat_` or `shppa_`)
   - ⚠️ You'll only see this once! Save it!

### Step 4: Get Collection ID
1. Go to Products → Collections
2. Click on your collection
3. Look at the URL in browser:
   ```
   https://admin.shopify.com/store/xxx/collections/299539955817
                                                   ^^^^^^^^^^^^^^
   ```
4. Copy the number (the Collection ID)

### Step 5: Configure .env.local
Open `frontend/.env.local` and add/update:

```env
NEXT_PUBLIC_SHOPIFY_STORE_URL=xploitrum.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_token_here
NEXT_PUBLIC_SHOPIFY_COLLECTION_ID=299539955817
```

### Step 6: Restart Server
```powershell
# Stop server (Ctrl+C)
cd frontend
npm run dev
```

### Step 7: Test!
Visit: `http://localhost:3000/merch`

You should see your products with "Add to Cart" buttons!

---

## ✅ Checklist

- [ ] Shopify store created
- [ ] Products added
- [ ] Collection created
- [ ] Storefront API app created
- [ ] Access token obtained
- [ ] Collection ID obtained
- [ ] Environment variables set
- [ ] Server restarted
- [ ] Products display correctly
- [ ] Add to cart works

---

## 🎨 Features

- **Responsive grid** layout
- **Product images** displayed
- **Titles and prices** shown
- **Quantity selector** for each product
- **Add to Cart** functionality
- **Shopping cart** icon in corner
- **Secure checkout** via Shopify
- **Theme matching** your cyber design

---

## ❓ Troubleshooting

### Products not showing?

**Check:**
1. Are all 3 environment variables set?
2. Did you restart the dev server?
3. Is your collection published? (not draft)
4. Does the collection have products?

**Verify in browser console (F12):**
- Any red errors?
- What's in the Network tab?

### Getting "Invalid token" error?

**Fix:**
- Make sure you copied the token correctly
- No spaces before/after the token
- Use Storefront API token (not Admin API)

### Collection ID not working?

**Try:**
- Use the numeric ID, not the handle
- Make sure it's in your collection URL
- Verify the collection exists and is published

### Still having issues?

Check `SHOPIFY_SETUP.md` for detailed troubleshooting or consult Shopify's documentation.

---

## 🚀 Deployment

When deploying to production, add the same 3 environment variables to your hosting platform:

- **Vercel:** Project Settings → Environment Variables
- **Docker:** Add to docker-compose.yml or .env file
- **VPS:** Add to production .env file

---

## 💡 Tips

- Keep your access token secure (never commit to git)
- Use separate tokens for dev/production
- Test thoroughly before going live
- Customize products in Shopify Admin
- Add multiple collections if needed

---

**Once configured, your merchandise page will be fully functional with shopping cart!** 🛒✨
