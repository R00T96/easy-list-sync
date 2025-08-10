# Shopping List — Bare-bones MVP Spec

## Overview
- Offline-first shopping list with optional cloud sync (post-MVP).
- Single shared list UI focused on speed and simplicity.

## Core Entities
- Item: { id, list_id, text, qty, done, updated_at, deleted, syncStatus }
- List: single local list for MVP
- User: none in MVP (planned for sync)

## Features (MVP)
- Add item (+) with text and quantity (default 1)
- Toggle done/undone
- Clear completed items
- Persist locally (localStorage JSON)
- Online/Offline indicator
- Newly created/edited items marked syncStatus="pending" (placeholder for future sync)

## Non-Goals (MVP)
- Multiple lists
- Authentication & real-time collaboration
- Server/cloud storage

## Post-MVP (Optional)
- Supabase auth and cloud sync (push pending, pull changes, soft-deletes, last-write-wins)
- Shared lists and permissions

## Tech & Run
- Stack: Vite + React + TypeScript + Tailwind + shadcn
- Dev: `npm i` then `npm run dev` (http://localhost:5173)

## Code Pointers
- UI: `src/pages/Index.tsx`
- Local store & persistence: `src/store/shoppingList.ts`
