# AI Tools Weekly Board

Single-page React app for publishing and browsing AI products.

The core idea:
- homepage shows the current launch week leaderboard
- users sign in with Google through Supabase Auth
- authenticated builders can submit projects
- each project can have a logo, screenshot, categories, and a scheduled launch week
- public visitors can browse all projects, open project pages, author pages, and category pages
- users can vote on published projects for the current launch cycle

This project is designed to keep working even when Supabase is not configured:
- with valid Supabase env vars, it uses real auth, database, and storage
- without them, it falls back to demo data so the UI still renders

## What This Project Is

This is not a generic landing page.

It is a lightweight product directory and weekly launch board for AI tools, with:
- weekly ranking on the homepage
- project submission flow
- author dashboard
- public project detail pages
- public author profile pages
- category browsing
- image uploads to Supabase Storage

## Stack

- React 18
- Vite 6
- Tailwind CSS
- Framer Motion
- Supabase JS v2
- Cloudflare Pages / Wrangler

## Fast Mental Model

If you are a developer or another AI agent, the quickest way to understand the app is:

1. `src/App.jsx`
2. `src/components/HomeView.jsx`
3. `src/components/SecondaryViews.jsx`
4. `src/components/SubmitModal.jsx`
5. `supabase/projects.sql`
6. `supabase/profiles.sql`

The app currently has one large orchestration file:
- [src/App.jsx](./src/App.jsx) contains most state, routing, data loading, submit logic, voting, auth handling, and view switching

The app does not use React Router.
Routing is handled manually with `window.history.pushState`, `window.location.pathname`, and a `popstate` listener.

## Main User Flows

### Public visitor

- opens `/`
- sees the current launch week board
- can vote on published projects
- can open:
  - all projects
  - a single project page
  - a category page
  - an author profile/dashboard page

### Authenticated builder

- signs in with Google via Supabase Auth
- opens the submit modal
- fills a 3-step wizard:
  - project info
  - logo and screenshot
  - launch week
- project is saved to Supabase
- builder can manage listings from the dashboard
- builder can update their public author profile

## Current Architecture

### Frontend

- [src/App.jsx](./src/App.jsx)
  Main app controller. Handles routing, session state, loading projects, loading votes, loading profiles, dashboard behavior, submit/edit/delete/restore flows, and top-level derived data.

- [src/components/HomeView.jsx](./src/components/HomeView.jsx)
  Weekly board homepage with countdown and voting UI.

- [src/components/SecondaryViews.jsx](./src/components/SecondaryViews.jsx)
  Contains:
  - dashboard view
  - all projects view
  - single project view
  - category view

- [src/components/SubmitModal.jsx](./src/components/SubmitModal.jsx)
  Multi-step submit/edit modal.

- [src/components/ui.jsx](./src/components/ui.jsx)
  Reusable UI primitives like `Surface`, `SectionIntro`, `ToolCard`, `EmptyState`, `ToastStack`.

- [src/lib/supabase.js](./src/lib/supabase.js)
  Creates the Supabase client only when env vars exist.

### Backend / Data

- [supabase/projects.sql](./supabase/projects.sql)
  Main schema for:
  - `projects`
  - `categories`
  - `project_categories`
  - `project_votes`
  - related RLS policies

- [supabase/profiles.sql](./supabase/profiles.sql)
  Public author profile table and policies.

- [supabase/storage.sql](./supabase/storage.sql)
  Public storage bucket and upload rules for project assets.

## Data Model Notes

The codebase is in a transitional but working state.

Important detail:
- older project versions stored categories as one comma-separated `category` text field
- current schema also supports normalized categories through `categories` and `project_categories`
- frontend supports both formats and normalizes them in code

This means:
- do not assume categories are only stored in one format
- check both legacy and relational handling before changing category logic

Other important entities:
- `projects`
- `profiles`
- `project_votes`

Key project fields used by the frontend:
- `id`
- `title`
- `slogan`
- `description`
- `project_url`
- `logo_url`
- `image_url`
- `owner_id`
- `owner_email`
- `published`
- `deleted`
- `created_at`
- `launch_week`
- `launch_date`

## Routing

Manual routes currently used:

- `/`
  homepage with the current launch week board

- `/projects`
  all published projects

- `/dashboard`
  signed-in user dashboard

- `/profile/:slug`
  public author profile view

- `/project/:slug`
  public project page

- `/preview/:id`
  private preview for the owner

- `/category/:slug`
  public category page

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Cloudflare helpers:

```bash
npm run cf:preview
npm run cf:deploy
```

## Environment Variables

Create `.env` from `.env.example` and set:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Behavior by environment:
- if both vars exist, the app uses real Supabase
- if they are missing, the app uses demo cards and disables real auth/data operations

## Supabase Setup

Run these SQL files in Supabase:

- `supabase/projects.sql`
- `supabase/profiles.sql`
- `supabase/storage.sql`

If your existing `projects.id` is still `uuid`, also review:

- `supabase/migrate_projects_uuid_to_bigint.sql`

## Google Auth Setup

The app uses:

```js
supabase.auth.signInWithOAuth({ provider: "google" })
```

You need to:
- enable Google provider in Supabase Auth
- add Google OAuth client ID and secret
- configure redirect URLs in Google Cloud Console
- allow your local and deployed site URLs in Supabase

Helpful local docs:
- `GOOGLE_OAUTH_SETUP.txt`
- `SUPABASE_GOOGLE_SETUP.txt`

## Deployment

Deployment is configured for Cloudflare in:

- [wrangler.jsonc](./wrangler.jsonc)

Important:
- SPA fallback is handled by Wrangler config
- do not add old redirect hacks unless you intentionally want to change deployment behavior

## Known Realities

These are not necessarily bugs, but they matter:

- `src/App.jsx` is large and owns too much logic
- routing is manual, not library-based
- category handling supports both legacy and relational formats
- the app has demo fallback behavior when Supabase is missing
- bundle size is already somewhat large, so future changes should watch for unnecessary growth

## Safe Change Strategy

If you are continuing work in this repo, safest order is:

1. Read `src/App.jsx`
2. Read the relevant view component
3. Read the matching Supabase SQL file
4. Make a focused change
5. Run `npm run build`

## Best Next Refactors

If the project keeps growing, the highest-value refactors are:

1. Split `src/App.jsx` into hooks and route/view controllers
2. Move Supabase data access into dedicated service files
3. Centralize route parsing and navigation helpers
4. Unify category handling around the normalized relational schema
5. Add tests for submit flow, routing, and voting

## One-Sentence Summary

This repo is a weekly AI product launch board with Supabase auth/data/storage, manual SPA routing, a builder dashboard, and a demo fallback mode when backend credentials are missing.
