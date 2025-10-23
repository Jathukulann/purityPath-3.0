# Design Guidelines for Addiction Recovery Web Application

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Headspace and Calm apps, focusing on mental wellness and mindfulness aesthetics. This approach prioritizes emotional support, visual calm, and encouraging user engagement through thoughtful design patterns.

## Core Design Elements

### A. Color Palette
**Light Mode:**
- Primary: #6B73FF (calming purple)
- Secondary: #9AA0B4 (soft grey-blue)
- Success: #4CAF50 (gentle green)
- Background: #F8F9FB (off-white)
- Text: #2E3A59 (deep blue-grey)
- Accent: #E8F4FD (light blue tint)

**Dark Mode:**
- Primary: #8B93FF (lighter purple for contrast)
- Secondary: #7A8194 (muted grey-blue)
- Success: #66BB6A (softer green)
- Background: #1A1D29 (deep blue-grey)
- Text: #E8EAF6 (light purple-grey)
- Accent: #2D3748 (dark blue-grey)

### B. Typography
- **Primary Font**: Inter (modern, readable, calming)
- **Secondary Font**: Nunito Sans (friendly, approachable)
- **Hierarchy**: Large headings (32px), body text (16px), small text (14px)
- **Weight Variations**: Regular (400), Medium (500), Semibold (600)

### C. Layout System
**Tailwind Spacing Units**: Consistent use of 2, 4, 6, 8, 12, 16, 24 units
- Micro spacing: p-2, m-2 (8px)
- Component spacing: p-4, m-4 (16px)
- Section spacing: p-8, m-8 (32px)
- Large gaps: gap-12, gap-16 (48px, 64px)

### D. Component Library

**Navigation:**
- Clean bottom navigation for mobile with 4 primary tabs
- Minimal top header with user avatar and settings
- Soft shadows and rounded corners (12px border radius)

**Cards & Containers:**
- Gentle elevation with subtle shadows
- 12px border radius throughout
- Card-based layout for all content sections
- Generous padding (p-6 to p-8)

**Buttons:**
- Primary: Filled with primary color
- Secondary: Outlined with soft borders
- Panic Button: Prominent red (#FF6B73) with pulsing animation
- Rounded design (8px border radius)

**Data Displays:**
- Streak counter: Large, prominent number with celebratory styling
- Progress charts: Soft, curved lines with gradient fills
- Journal entries: Card-based with gentle borders

**Forms:**
- Clean, minimal input fields
- Soft focus states with primary color
- Encouraging placeholder text
- Subtle validation feedback

### E. Visual Treatments

**Breathing Exercise Interface:**
- Expanding/contracting circle animation
- Soft gradient backgrounds
- Calming instructional text
- Progress indicators for breathing cycles

**Dashboard Elements:**
- Milestone badges with gentle celebrations
- Daily affirmation cards with inspiring typography
- Progress streaks with visual continuity
- Encouraging micro-interactions on achievement

**Mobile Optimization:**
- Touch-friendly button sizes (44px minimum)
- Thumb-friendly navigation placement
- Readable text sizes without zooming
- Swipe gestures for journal navigation

## Images
**Hero Section**: Large, calming nature image (mountains, ocean, or forest) with soft overlay for text readability. Use images that evoke peace and stability.

**Background Elements**: Subtle geometric patterns or soft gradients rather than photography for secondary sections.

**Iconography**: Use Heroicons for consistency - choose outlined style for secondary actions and filled style for primary actions.

**Illustrations**: Minimal, supportive illustrations for empty states and onboarding - focus on growth, progress, and calm themes.

## Key Design Principles
- **Encouraging**: Every interaction should feel supportive, never judgmental
- **Private**: Visual cues that emphasize security and confidentiality
- **Calming**: Soft transitions, gentle colors, and breathing room
- **Progressive**: Clear visual feedback for growth and achievements
- **Accessible**: High contrast ratios and clear touch targets for all users