# Instagram API Integration — Setup Guide
## Portfolio for @yeoguess

---

## How it works

Your access token is stored as a **secret environment variable** on Netlify/Vercel —
it never touches the browser. The site calls `/api/instagram`, your serverless
function fetches from Instagram, and only the media data comes back to the page.

```
Browser → /api/instagram (your server) → Instagram Graph API → photos back to browser
```

---

## Step 1 — Get your Long-Lived Access Token

Your current token from Meta may be a **short-lived token (expires in 1 hour)**.
You need a **long-lived token (expires in 60 days)**.

Run this in your terminal (replace the placeholders):

```bash
curl -X GET \
  "https://graph.instagram.com/access_token
    ?grant_type=ig_exchange_token
    &client_secret=YOUR_APP_SECRET
    &access_token=YOUR_SHORT_LIVED_TOKEN"
```

You'll get back a token like:
```json
{ "access_token": "IGAABx...", "token_type": "bearer", "expires_in": 5183944 }
```

> 💡 **Pro tip**: Set a calendar reminder to refresh this every 55 days,
> or set up automatic token refresh (see Step 4).

---

## Step 2 — Choose your host and deploy

### Option A — Netlify

1. Push this folder to a GitHub repo
2. Go to [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import from Git"
3. Set build settings:
   - **Publish directory**: `.`
   - **Functions directory**: `netlify/functions` (auto-detected from `netlify.toml`)
4. Go to **Site Settings → Environment Variables** and add:
   ```
   Key:   INSTAGRAM_ACCESS_TOKEN
   Value: IGAABx...  (your long-lived token)
   ```
5. Deploy. Your function will be live at `/.netlify/functions/instagram`
   (the `netlify.toml` redirects `/api/instagram` → there automatically)

---

### Option B — Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → "Add New Project" → import your repo
3. Go to **Project Settings → Environment Variables** and add:
   ```
   Key:   INSTAGRAM_ACCESS_TOKEN
   Value: IGAABx...  (your long-lived token)
   ```
4. Deploy. Vercel auto-detects the `/api/instagram.js` file as a serverless function.

---

## Step 3 — Test it

After deploying, open your browser console and run:

```js
fetch('/api/instagram').then(r => r.json()).then(console.log)
```

You should see your posts returned as JSON. If you see an error, check:
- ✅ Environment variable is spelled exactly `INSTAGRAM_ACCESS_TOKEN`
- ✅ Token hasn't expired
- ✅ Your Instagram account is set to **Professional** (Creator or Business)

---

## Step 4 — Auto-refresh your token (recommended)

Long-lived tokens must be refreshed before 60 days. Add this second
Netlify/Vercel function to refresh automatically:

**`netlify/functions/refresh-token.js`**
```js
exports.handler = async () => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );
  const data = await res.json();
  console.log("Token refreshed, expires in:", data.expires_in, "seconds");
  return { statusCode: 200, body: JSON.stringify(data) };
};
```

Then set a **Netlify Scheduled Function** or a **GitHub Actions cron job**
to call it every 30 days.

---

## File Structure

```
your-portfolio/
├── index.html                     ← Your portfolio (already updated)
├── netlify.toml                   ← Netlify config (redirects + functions dir)
├── netlify/
│   └── functions/
│       └── instagram.js           ← Netlify serverless function (use this for Netlify)
└── api/
    └── instagram.js               ← Vercel serverless function (use this for Vercel)
```

> ⚠️ You only need ONE of `netlify/functions/instagram.js` OR `api/instagram.js`
> depending on your host. Both are included for your convenience.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `"Instagram token not configured"` | Check env variable name is exactly `INSTAGRAM_ACCESS_TOKEN` |
| `"Invalid OAuth access token"` | Token expired — generate a new long-lived token |
| `"Application does not have permission"` | Your Instagram account must be Creator or Business type |
| Images not loading | Instagram media URLs expire after ~1 hour; consider caching responses |
| CORS error in browser | The serverless function handles CORS — make sure you're calling `/api/instagram` not the Instagram API directly |

---

## Questions?

The Instagram Graph API docs: https://developers.facebook.com/docs/instagram-api
