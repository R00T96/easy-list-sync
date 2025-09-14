# OpenList Page Behavior

## Purpose
- Displays and manages a shared shopping list for a given room (pin).
- Handles joining a room, item management, syncing, notifications, and error boundaries.

## Main Components
- **Header**: Shows online/sync status, manual sync button.
- **PinGateStage**: Shown if no pin is set; allows joining a room.
- **ListStage**: Main list UI; shows items, allows add/update/clear/restore actions.
- **AppFooter**: Footer UI.
- **ErrorBoundary**: Catches and displays errors.

## Contexts & Providers
- **ShoppingListProvider**: Wraps the page, provides shopping list state and actions.
- **useShoppingList**: Accesses and mutates list items (add, toggle, update qty, clear completed, restore).

## Hooks
- **usePin**: Gets/sets the current room pin.
- **useUrlPin**: Reads pin from URL, clears after use.
- **useItemForm**: Manages add-item form state (text, qty, canSubmit, reset).
- **useSync**: Handles sync state and actions (isOnline, isSyncing, syncNow, syncSoon, clientId).
- **useServerMerges**: Applies server-side changes (upsert, delete) using clientId.
- **useRealtimeSync**: Subscribes to real-time updates for the pin; triggers silent catch-up sync on subscribe.
- **useSEO**: Sets page title/description for SEO.
- **use-toast**: Shows toast notifications for feedback/errors.

## Effects
- **Notification Permission**: Checks browser notification support/permission on mount.
- **Realtime Sync**: Subscribes to updates for the current pin; triggers debounced sync on first subscribe.
- **SEO**: Updates page metadata based on pin.

## Services
- **syncService**: Used via hooks to push/pull list changes to server.
- **realtimeService**: Used via hooks for real-time updates.

## Actions
- **addItem**: Adds item to current room; triggers background sync.
- **updateQty**: Updates item quantity; triggers background sync.
- **toggleDone**: Toggles item done state; triggers background sync.
- **clearCompleted**: Removes completed items for current room; triggers background sync and toast.
- **restoreItem**: Restores deleted item; triggers background sync.
- **requestSync**: Manual sync; shows toast if offline.
- **requestNotificationPermission**: Requests browser notification permission; shows feedback to user.

## State
- **showAllItems**: Toggles showing deleted items.
- **notificationPermission**: Tracks browser notification permission state.

## Why
- **Hooks/Contexts**: Encapsulate logic for pin, list state, sync, and real-time updates for modularity and testability.
- **Effects**: Ensure UI reacts to changes in pin, notification, and sync state.
- **Services**: Abstract server/realtime logic for maintainability.
- **Actions**: Centralize user-triggered mutations and feedback.

---
This file summarizes the behavior and structure of `OpenList.tsx` for quick reference and onboarding.