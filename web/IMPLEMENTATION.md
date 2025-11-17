# Frontend Implementation - SuiPatreon

This document describes the frontend implementation for the Sui-based Patreon alternative platform.

## Overview

A complete Next.js 16 application with React 19, TypeScript, and Tailwind CSS v4, implementing a dark-themed UI matching the Patreon design reference.

## Project Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout with dark theme
│   │   ├── page.tsx                  # Homepage with creator discovery
│   │   ├── explore/                  # Explore page with topics
│   │   ├── creator/
│   │   │   ├── [address]/           # Individual creator profiles
│   │   │   └── dashboard/           # Creator dashboard
│   │   ├── chats/                   # Messaging (placeholder)
│   │   ├── notifications/           # Notifications (placeholder)
│   │   └── settings/                # Settings (placeholder)
│   │
│   ├── components/
│   │   ├── ui/                      # Base UI components
│   │   │   ├── button.tsx           # Button with variants
│   │   │   └── input.tsx            # Input component
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── sidebar.tsx          # Left navigation sidebar
│   │   │   └── header.tsx           # Top header with search
│   │   │
│   │   ├── auth/                    # Authentication
│   │   │   └── login-button.tsx     # zkLogin integration (placeholder)
│   │   │
│   │   ├── creator/                 # Creator components
│   │   │   ├── creator-card.tsx     # Creator preview card
│   │   │   ├── topic-card.tsx       # Topic category card
│   │   │   ├── create-profile-form.tsx
│   │   │   └── create-tier-form.tsx
│   │   │
│   │   └── content/                 # Content components
│   │       ├── content-card.tsx     # Content preview card
│   │       └── upload-form.tsx      # Content upload form
│   │
│   ├── lib/
│   │   ├── utils.ts                 # Utility functions
│   │   ├── mock-data.ts             # Mock data for development
│   │   └── blockchain.ts            # Smart contract integration (placeholders)
│   │
│   └── types/
│       └── index.ts                 # TypeScript type definitions
│
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Tailwind CSS v4 config
└── tsconfig.json                    # TypeScript configuration
```

## Key Features Implemented

### 1. Dark Theme UI
- Custom color palette matching Patreon design
- CSS variables for consistent theming
- Smooth transitions and hover effects
- Custom scrollbar styling

### 2. Layout Components

#### Sidebar (`components/layout/sidebar.tsx`)
- Fixed left navigation with icons
- Active route highlighting
- Logo and user section
- Navigation items: Home, Explore, Chats, Notifications, Settings

#### Header (`components/layout/header.tsx`)
- Sticky top header with backdrop blur
- Search input with icon
- Login button (zkLogin integration pending)
- Conditional rendering based on auth state

### 3. Pages

#### Homepage (`app/page.tsx`)
- Recently visited creators
- Creators for you recommendations
- Popular this week section
- Empty state for non-logged-in users

#### Explore Page (`app/explore/page.tsx`)
- Topic category grid
- New creators section
- Category-filtered creator lists
- Responsive grid layout

#### Creator Profile (`app/creator/[address]/page.tsx`)
- Cover image and avatar
- Creator bio and stats
- Subscription tier cards
- Recent content grid
- Subscribe buttons

#### Creator Dashboard (`app/creator/dashboard/page.tsx`)
- Stats overview (subscribers, revenue, views, content)
- Quick action cards
- Recent content list
- Empty state with call-to-action

### 4. Discovery Components

#### CreatorCard (`components/creator/creator-card.tsx`)
- Cover image with gradient fallback
- Avatar overlay
- Verified badge
- Follower count
- Category tag
- Hover effects

#### TopicCard (`components/creator/topic-card.tsx`)
- Dynamic icon rendering
- Creator count
- Description
- Hover animations

#### ContentCard (`components/content/content-card.tsx`)
- Thumbnail with play icon (video/audio)
- Lock icon for private content
- View and like counts
- Relative timestamps

### 5. Forms

#### CreateProfileForm (`components/creator/create-profile-form.tsx`)
- Display name, SuiNS name
- Bio textarea
- Category selection
- Avatar and cover image URLs
- Smart contract integration placeholders

#### CreateTierForm (`components/creator/create-tier-form.tsx`)
- Tier name, description, price
- Dynamic benefits list
- Add/remove benefit inputs
- SUI pricing with conversion notes

#### UploadForm (`components/content/upload-form.tsx`)
- Title and description
- Content type selection
- File upload
- Public/private toggle
- Walrus and Seal integration placeholders

### 6. Authentication

#### LoginButton (`components/auth/login-button.tsx`)
- Google OAuth UI
- Loading state
- zkLogin flow placeholders
- TODO comments for Task #15 integration

## Integration Points (Pending)

### Smart Contract Integration (`lib/blockchain.ts`)

All blockchain functions are stubbed with TODO comments:

1. **Creator Profile** (Task #1)
   - `createCreatorProfile()`
   - `updateCreatorProfile()`
   - `getCreatorProfile()`

2. **Subscription Tiers** (Task #2)
   - `createSubscriptionTier()`
   - `getCreatorTiers()`
   - `subscribe()`
   - `getUserSubscriptions()`

3. **Content Management** (Task #3)
   - `createContent()`
   - `getCreatorContent()`

4. **Walrus Storage** (Task #3)
   - `uploadToWalrus()`
   - `downloadFromWalrus()`

5. **Seal Encryption** (Task #4)
   - `encryptContent()`
   - `decryptContent()`

6. **zkLogin Authentication** (Task #15)
   - OAuth redirect flow
   - Ephemeral keypair generation
   - ZK proof generation
   - Sui address derivation

## Mock Data

Located in `lib/mock-data.ts`:

- 4 creator profiles with diverse categories
- 3 subscription tiers with benefits
- 2 content items
- 8 topic categories
- Realistic follower counts and metadata

## Styling

### Tailwind CSS v4
- Custom theme in `globals.css`
- Utility-first approach
- Responsive breakpoints
- Dark theme by default

### Design Tokens
```css
--primary: #ff424d (Patreon red)
--background: #0a0a0a (dark)
--card: #141414
--border: #262626
--muted: #1a1a1a
```

## Type Safety

All components use TypeScript with strict mode enabled:
- Interface definitions in `types/index.ts`
- Prop type checking
- Return type annotations
- No `any` types

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible states
- Screen reader friendly

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`
- Flexible grid layouts
- Responsive images with Next.js Image
- Sidebar adapts on mobile (pending)

## Performance

- React 19 compiler enabled
- Server Components by default
- Client Components only where needed
- Image optimization
- Static page generation
- Code splitting

## Running the Application

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Next Steps

1. **zkLogin Integration** (Task #15)
   - Implement actual OAuth flow
   - Generate ephemeral keypairs
   - Handle callbacks and ZK proofs

2. **Smart Contract Integration** (Tasks #1-4)
   - Replace placeholder functions
   - Add transaction signing
   - Handle blockchain events

3. **Backend API** (Tasks #6-12)
   - Connect to GraphQL API
   - Real-time subscriptions
   - Data fetching and caching

4. **State Management**
   - Set up Zustand stores
   - Auth state
   - User data
   - Creator data

5. **Testing**
   - Unit tests for components
   - Integration tests
   - E2E tests with Playwright

6. **Mobile Responsiveness**
   - Sidebar drawer on mobile
   - Touch-friendly interactions
   - Mobile navigation

## File Manifest

### Core Files
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Homepage
- `src/app/globals.css` - Global styles

### Components (15 files)
- UI: button.tsx, input.tsx
- Layout: sidebar.tsx, header.tsx
- Auth: login-button.tsx
- Creator: creator-card.tsx, topic-card.tsx, create-profile-form.tsx, create-tier-form.tsx
- Content: content-card.tsx, upload-form.tsx

### Pages (8 routes)
- `/` - Home
- `/explore` - Discovery
- `/creator/[address]` - Creator profile
- `/creator/dashboard` - Creator dashboard
- `/chats` - Messaging (placeholder)
- `/notifications` - Notifications (placeholder)
- `/settings` - Settings (placeholder)

### Library Files
- `lib/utils.ts` - Utility functions
- `lib/mock-data.ts` - Mock data
- `lib/blockchain.ts` - Blockchain placeholders
- `types/index.ts` - TypeScript types

## Dependencies

### Production
- Next.js 16.0.3
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS v4
- Radix UI (Dialog, Dropdown, Select, Tabs, Slot)
- Lucide React (Icons)
- Zustand (State management)
- @mysten/dapp-kit, @mysten/zklogin (Sui integration)

### Development
- ESLint
- TypeScript
- Tailwind PostCSS
- React Compiler

## Notes

- All blockchain calls are mocked for UI development
- Images use Dicebear API and Unsplash for demos
- Dark theme is forced for consistency
- TODO comments mark integration points
- Build passes with no errors or warnings
