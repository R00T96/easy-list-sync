# Easy List Sync — MVP Spec

## Overview
- Offline-first shopping list with cloud sync.
- Single shared list UI focused on speed, simplicity, and reliability.
- Designed for quick add/check-off, minimal distractions.

## Core Entities
- **Item:** `{ id, list_id, text, qty, done, updated_at, deleted, syncStatus }`
- **List:** Single local list for MVP.
- **User:** None in MVP (planned for sync).

## MVP Features
- Add item with text and quantity (default: 1).
- Toggle item done/undone.
- Edit item text/quantity.
- Remove item (soft-delete).
- Clear completed items.
- Persist list locally (`localStorage` as JSON).
- Online/offline indicator.
- Items marked `syncStatus="pending"` when created/edited (for future sync).
- Responsive UI (mobile-first).
- Fast keyboard entry (Enter to add, arrows to navigate).
- Undo last delete (single-level).

## Non-Goals (MVP)
- Multiple lists.
- Authentication & real-time collaboration.
- Server/cloud storage.
- Item categories, sorting, or advanced filtering.

## Post-MVP (Planned)
- Supabase auth and cloud sync (push/pull, soft-deletes, last-write-wins).
- Shared lists and permissions.
- Multi-device sync.
- List history/versioning.
- Item categories/tags.

## Tech Stack
- Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- Local storage for persistence.FUNDING.yml
- Planned: Supabase for cloud sync.

## Getting Started
1. Install dependencies:  
   `npm install`
2. Run dev server:  
   `npm run dev`  
   App runs at [http://localhost:5173](http://localhost:5173)

## Code Structure
- **UI:** [`src/pages/Index.tsx`](src/pages/Index.tsx)
- **Local store & persistence:** [`src/store/shoppingList.ts`](src/store/shoppingList.ts)
- **Sync logic (future):** [`src/store/sync.ts`](src/store/sync.ts)

## Contributing
- PRs welcome for bug fixes, UI polish, and accessibility.
- For sync/cloud features,
