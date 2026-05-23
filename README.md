# 🥗 Macro Tracker

A clean, simple macro and calorie tracking web app. Built with Next.js and deployable to Vercel in minutes.

## Features

- **Public calculator** — search foods, set portions, build meals (Breakfast / Lunch / Dinner / Supper), see live macro totals
- **Admin panel** (`/admin`) — password-protected page to add new foods to the database
- **13 foods pre-loaded** from your personal database (eggs, chicken, rice, and more)
- Clean white UI, works on mobile and desktop

---

## Setup & Deployment

### 1. Clone / download this project

```bash
git init
git add .
git commit -m "initial commit"
```

Push to a GitHub repository (GitHub.com → New repository → follow instructions).

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (free account)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Click **Deploy** — it just works for Next.js automatically

### 3. Add your environment variables

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `ADMIN_PASSWORD` | A strong password (only you will know this) |

> Without this, the admin panel will reject all login attempts.

### 4. (Optional but recommended) Add Vercel KV for persistent food storage

Without KV, foods added by admin are stored in memory and **reset whenever the server restarts**. With KV, they persist permanently.

1. In your Vercel project → **Storage** tab → **Create Database → KV**
2. Name it anything (e.g. `macro-tracker-kv`)
3. Click **Connect to Project** — Vercel automatically adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars

That's it! Redeploy and admin-added foods will persist forever.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and set ADMIN_PASSWORD

# 3. Run the dev server
npm run dev

# Open http://localhost:3000
```

For local KV, either skip it (foods reset on restart) or point to an Upstash Redis instance.

---

## Admin Usage

1. Visit `/admin` on your deployed app
2. Enter your `ADMIN_PASSWORD`
3. Fill in the **Add New Food** form:
   - **Food Name** — display name
   - **Serving Size + Unit** — the reference amount (e.g. 100g, 30ml)
   - **Calories / Protein / Carbs / Fat** — macros *per that serving size*
4. Hit **Add Food** — it appears in the food list immediately and is available on the public calculator

Default foods (the 13 pre-loaded items) cannot be deleted. Custom foods you add have a **Delete** button.

---

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel KV](https://vercel.com/storage/kv) (optional, for food persistence)
- TypeScript
