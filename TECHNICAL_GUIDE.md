# Technical Guide

## Project Snapshot

This project is a single-page React app built with Vite and powered by Supabase.

Main purpose:
- show AI product cards
- allow Google sign-in via Supabase Auth
- allow authenticated users to submit projects
- upload logo and screenshot assets to Supabase Storage
- browse projects by category

Current stable branch checkpoint:
- `main`

## Stack

- React 18
- Vite 6
- Supabase JS v2
- Cloudflare Pages / Wrangler for deployment

## Important Files

- `src/App.jsx`
  Main application logic, routing, modal flow, category filtering, project/category pages.

- `src/styles.css`
  All UI styles live here.

- `src/lib/supabase.js`
  Supabase client initialization and env-based enable/disable logic.

- `supabase/projects.sql`
  SQL schema and RLS setup for the `projects` table.

- `supabase/storage.sql`
  Storage bucket and storage policy setup for uploaded assets.

- `wrangler.jsonc`
  Cloudflare deployment config for SPA behavior.

## Routing Model

This app does not use React Router.

Routing is implemented manually in `src/App.jsx` via:
- `window.history.pushState`
- `window.location.pathname`
- `popstate` listener

Current routes:
- `/`
  Home page with project cards

- `/dashboard`
  Personal dashboard for signed-in user projects

- `/project/:slug`
  Single project page

- `/category/:slug`
  Category page opened only from category chips on cards

## Category Behavior

There are two separate category interactions:

1. Sidebar categories on home
- do not navigate away
- only filter cards on the home page

2. Category chips on project cards
- navigate to `/category/:slug`
- open a dedicated category page

This distinction is intentional and should be preserved unless product requirements change.

## Data Model

Current `projects` table fields used by the frontend:
- `id`
- `title`
- `slogan`
- `description`
- `category`
- `project_url`
- `logo_url`
- `image_url`
- `owner_id`
- `owner_email`
- `created_at`

Important note about `category`:
- the UI supports selecting multiple categories
- the frontend currently stores them as one comma-separated `text` value
- the UI converts that string back into a list with `getCategoryList(...)`

Example stored value:
- `Automation, AI Agents, Marketing`

If someone wants stricter data handling later, this can be migrated to `text[]`, but current code assumes `text`.

## Submission Flow

The modal is a 3-step wizard:

1. Information
- title
- categories
- slogan
- description
- project URL

2. Assets
- logo
- screenshot

3. Launch week
- week picker

Validation is step-based.

On submit:
- logo uploads to Supabase Storage
- screenshot uploads to Supabase Storage
- project row is inserted into `projects`

## UI Rules Already Implemented

- project cards have equal-height layout behavior
- card action buttons stay pinned to the bottom
- slogan is clamped and should not stretch the card
- category chips in card hero area are very small by design
- if chips wrap, upper rows should appear above lower rows

These behaviors are implemented in `src/styles.css` and are easy to accidentally break while restyling cards.

## Deployment Notes

Use:
- `npm run build`

Cloudflare helpers:
- `npm run cf:deploy`
- `npm run cf:preview`

Important:
- do not reintroduce `public/_redirects` with `/* /index.html 200`
- SPA fallback is already handled in `wrangler.jsonc`

## Local Run

```bash
npm install
npm run dev
```

## Env Vars

Required in `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Without them:
- app falls back to demo cards
- auth and real data loading are disabled

## Safe Change Strategy

If another AI or developer continues from here, safest order is:

1. Read `src/App.jsx`
2. Read `src/styles.css`
3. Run `npm run build`
4. Make one focused change at a time
5. Re-run `npm run build`

## Known Tradeoffs

- manual routing instead of router library
- `category` is stored as comma-separated text, not normalized data
- most UI and state logic still live in one large `App.jsx`

These are acceptable for the current project size, but they are the first places to revisit if the app grows.
