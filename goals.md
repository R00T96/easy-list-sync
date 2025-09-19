# Goals Feature: Technical Specification & Future Direction

## Overview
The Goals feature provides a low-noise, gamified interface for users to build a "life-blueprint" by answering a series of multiple-choice questions. Each blueprint is associated with a unique PIN and can seed a collaborative LiveList with relevant demo items. The feature is designed for high signal, high ROI onboarding and user profiling, with a focus on tap/touch interactions (no typing required).

---

## Current Implementation

### 1. User Flow
- User navigates to `/goals`.
- Presented with a set of "blueprints" (goal categories) sourced from demo seed data.
- User selects a goal (category), generating a unique PIN.
- User answers a series of multiple-choice questions to build a "needs profile".
- On completion, a summary is shown with the selected goal, PIN, and profile.
- User can click "Go to List" to:
  - Seed a LiveList (shopping list) with demo items for the selected goal and PIN.
  - Be redirected to `/public?pin=PIN` to collaborate in real time.

### 2. Data Model
- **Blueprint/Goal**: Category name, emoji, and a set of demo items.
- **PIN**: 6-character alphanumeric code, generated per goal selection.
- **Profile**: Array of answers to onboarding questions.
- **Seed Items**: Demo items associated with the selected goal, stored temporarily in localStorage for seeding the LiveList.

### 3. Key Components
- `Goals.tsx`: Main UI for blueprint selection, questions, and summary.
- `useDemoSeeds.ts`: Provides demo goal categories and items.
- `LiveList.tsx`: Collaborative list, auto-seeds with items if launched from Goals.
- `Header.tsx`: Provides navigation to Goals from anywhere in the app.

### 4. Seeding Mechanism
- On "Go to List", demo items for the selected goal are stored in localStorage under a key for the PIN.
- `LiveList.tsx` checks for this key on mount and batch-adds items if found, then removes the key.

---

## Technical Considerations

- **Routing**: Uses React Router for navigation (`/goals`, `/public?pin=PIN`).
- **State Management**: Local state for onboarding; localStorage for cross-page seeding.
- **Extensibility**: Demo seeds and questions are modular and can be expanded.
- **No Backend Dependency**: All seeding logic is client-side for demo purposes.
- **Accessibility**: Tap/touch-first, no typing required for onboarding.

---

## Future Direction

### 1. Persistent Blueprints & Profiles
- Store user blueprints and profiles in a backend (e.g., Supabase, Firebase) for retrieval, analytics, and cross-device sync.
- Allow users to revisit, edit, or share their blueprints.

### 2. Dynamic/Personalized Questions
- Generate onboarding questions dynamically based on user context or previous answers.
- Support branching logic for more personalized blueprints.

### 3. Advanced Seeding & Templates
- Allow users to create and save their own goal templates and item sets.
- Enable community sharing of blueprints and templates.

### 4. Gamification & Progression
- Add progress tracking, achievements, and rewards for completing blueprints or collaborating on lists.
- Visualize user growth and blueprint history.

### 5. Analytics & Insights
- Provide users with insights based on their blueprint choices and list activity.
- Use AI to suggest next steps, habits, or goals.

### 6. Mobile & PWA Enhancements
- Optimize for mobile-first onboarding and offline support.
- Push notifications for goal reminders and collaboration.

### 7. Integration with Other Services
- Sync blueprints or lists with calendar, task managers, or wellness apps.
- Export/import blueprints as JSON or other formats.

---

## Open Questions
- How should blueprints be shared or collaborated on beyond the initial list?
- What privacy controls are needed for user profiles and blueprints?
- Should blueprints be versioned or support branching/forking?

---

## Summary
The Goals feature is a foundation for onboarding, user profiling, and collaborative planning. Its future direction includes deeper personalization, persistence, gamification, analytics, and integration with broader productivity and wellness ecosystems.
