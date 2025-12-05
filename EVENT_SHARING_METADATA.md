# Event Sharing & Metadata Guide

## Overview
Events now use slug-based URLs (e.g., `/events/my-event-title`) and include rich metadata for social media link previews.

## URL Format
Events are accessible via slug-based URLs generated from their titles:
- Example: "Workshop on Cybersecurity" → `/events/workshop-on-cybersecurity`
- Old format (still supported): `/events/123` (numeric ID)

## Metadata & Link Previews

### How It Works
Rich link previews (showing title, description, image, etc. when sharing links) work when:
1. **The page is publicly accessible** - Social media crawlers need to access your page
2. **Meta tags are present** - Open Graph and Twitter Card tags are automatically generated
3. **Absolute URLs are used** - Images and URLs must be absolute (not relative)

### Development vs Production

**In Development (localhost):**
- ❌ Link previews **won't work** because:
  - Social media platforms can't access `localhost:3000`
  - Preview services can't crawl local URLs
  - This is expected behavior

**In Production:**
- ✅ Link previews **will work** when:
  - Your site is deployed and publicly accessible
  - `NEXT_PUBLIC_SITE_URL` environment variable is set correctly
  - Social media platforms can crawl your URLs

### Testing Metadata

To test if metadata is working:

1. **Check HTML source:**
   - Open event page in browser
   - View page source (Ctrl+U / Cmd+U)
   - Look for `<meta property="og:title">`, `<meta property="og:description">`, etc.

2. **Use online validators:**
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

3. **Clear cache:**
   - Social platforms cache link previews
   - Use the debugger tools above to "scrape again" and clear cache

### Environment Variables

Set in production:
```env
NEXT_PUBLIC_SITE_URL=https://www.xploitrum.org
```

This ensures:
- Absolute URLs in meta tags
- Proper link preview generation
- Correct canonical URLs

## Share Functionality

### Native Share API
- Works on mobile devices (iPhone, Android)
- Shows native share menu
- Includes rich metadata automatically

### Share Data Includes:
- **Title**: Event title
- **Description**: Event description with date/time/location
- **URL**: Event slug URL (e.g., `/events/my-event-title`)
- **Images**: XploitRUM logo (1200x630px)

## Implementation Details

### Backend
- Supports lookup by both ID and slug
- Slug is generated dynamically from event title
- No database changes required

### Frontend
- Slug-based URLs generated using `slugify()` utility
- Automatic redirects from old ID-based URLs still work
- Metadata generated server-side for better SEO

## Troubleshooting

**Metadata not showing in previews:**
1. Ensure `NEXT_PUBLIC_SITE_URL` is set in production
2. Verify the page is publicly accessible
3. Check that Open Graph tags exist in page source
4. Clear social media cache using debugger tools
5. Wait a few minutes for crawlers to update

**Slug conflicts:**
- If two events have the same title, the first one found will be used
- Consider adding dates or unique identifiers to event titles

