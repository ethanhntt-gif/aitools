# aitools

Homepage listing for AI projects with:

- header
- footer
- project cards rendered from Supabase
- Google authorization with Supabase Auth
- project submission form for authenticated users
- logo and screenshot upload from local computer

## Run locally

```bash
npm install
npm run dev
```

## Supabase setup

1. Copy `.env.example` to `.env`
2. Set `VITE_SUPABASE_URL`
3. Set `VITE_SUPABASE_ANON_KEY`
4. Create a `projects` table with fields:

```text
id
title
slogan
description
category
project_url
image_url
created_at
```

If Supabase credentials are missing or the request fails, the homepage shows demo cards so the UI still works.

You can use the ready SQL schema in:

- `supabase/projects.sql`
- `supabase/storage.sql`

## Google Auth setup

1. In Supabase, open `Authentication` -> `Providers` -> `Google`
2. Enable Google provider
3. Add your Google OAuth client ID and client secret
4. In Google Cloud Console, add authorized redirect URLs from Supabase
5. Add your site URLs in Supabase URL configuration:

```text
http://localhost:5173
https://your-cloudflare-project.pages.dev
```

The app uses `supabase.auth.signInWithOAuth({ provider: "google" })` and redirects back to the current site origin.

## Project submission

Authenticated users can submit a project from the homepage.

To enable this in Supabase:

1. Open SQL Editor
2. Run `supabase/projects.sql`
3. Run `supabase/storage.sql`
3. Keep Google auth enabled

This creates:

- the `projects` table
- public read access for cards
- insert access for authenticated users
- a public storage bucket for uploaded logos and screenshots

## Ready-made setup files

Use these local files as templates:

- `.env`
- `SUPABASE_GOOGLE_SETUP.txt`
- `GOOGLE_OAUTH_SETUP.txt`
