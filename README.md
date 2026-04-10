# aitools

Homepage listing for AI projects with:

- header
- footer
- project cards rendered from Supabase

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
description
category
project_url
image_url
created_at
```

If Supabase credentials are missing or the request fails, the homepage shows demo cards so the UI still works.
