# Diagrammi Tecnici: Navigazione e Routing

## 1. GitHub Pages SPA Routing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP-BY-STEP: Deep-Link Routing on GitHub Pages                    │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1: Request
─────────────
User Browser                    GitHub Pages                    Static Storage
    │                               │                              │
    │  GET /dashboard               │                              │
    ├──────────────────────────────>│                              │
    │                               │ ✗ Resource not found         │
    │                               ├─────────────────────────────>│
    │                               │ "dashboard" file NOT exist    │
    │                               │<─────────────────────────────┤
    │                               │ Serve 404.html instead       │
    │  404.html file                │                              │
    │<──────────────────────────────┤                              │
    │                               │                              │
    └─────────────────────────────────────────────────────────────────

PHASE 2: Redirect Calculation (in 404.html)
─────────────────────────────────────
Browser executes script in 404.html:

1. Get location.pathname
   ├─ Strips baseHref: /artist-business-manager/
   ├─ Extracts: /dashboard
   └─ Result: "/dashboard"

2. Encode path
   ├─ Input: "/dashboard"
   ├─ URL encode: %2Fdashboard
   └─ Result: "redirect=%2Fdashboard"

3. Create redirect URL
   ├─ Base: location.origin/artist-business-manager/
   ├─ Add: index.html
   ├─ Add: query param
   └─ Result: "/?redirect=%2Fdashboard"

4. Execute redirect
   └─ window.location = "/?redirect=%2Fdashboard"

PHASE 3: Browser Redirect
──────────────────────────
    │  Redirect to: /?redirect=%2Fdashboard
    ├──────────────────────────────>│
    │                               │ index.html loaded
    │  200 OK + index.html          │
    │<──────────────────────────────┤
    │                               │
    └─────────────────────────────────────────────────────────────────

PHASE 4: App Component Processing
────────────────────────────────
Browser loads app.ts:

1. Angular starts bootstrap
2. App component initializes
3. Constructor runs with effect()
4. Effect checks: queryParams['redirect']
5. Found: "redirect=%2Fdashboard"
6. Decode: "%2Fdashboard" → "/dashboard"
7. Call: router.navigateByUrl("/dashboard")
8. Router navigates to /dashboard
9. DashboardComponent loaded
10. URL history updated (query param removed)

Result in Browser URL Bar:
   BEFORE: /?redirect=%2Fdashboard
   AFTER:  /dashboard

FINAL STATE
───────────
✅ User sees: Dashboard page
✅ URL shows: /dashboard (clean, no params visible)
✅ No error 404 displayed
✅ Navigation is transparent to user
✅ Timestamp: < 1 second total

```

---

## 2. Responsive Navigation Component Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ RESPONSIVE NAV COMPONENT - Signal Flow & Reactivity               │
└────────────────────────────────────────────────────────────────────┘

INPUT DATA
──────────
    navigationItems: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊', exact: true },
      { path: '/works', label: 'Lavori', icon: '✓' },
      // ... 7 more items
    ]

SIGNAL STATE
────────────
    ┌─────────────────────────────────┐
    │ navigationItems (const)          │
    └─────────────────────────────────┘
                  │
                  ├─────────────────────────────────┬──────────────────────┐
                  │                                 │                      │
                  ▼                                 ▼                      ▼
        ┌──────────────────┐           ┌──────────────────┐    ┌──────────────────┐
        │ moreMenuOpen     │           │ visibleCount     │    │ Router (inject)  │
        │ signal(false)    │           │ signal(9)        │    │ for navigation   │
        └──────────────────┘           └──────────────────┘    └──────────────────┘
              │ RW                            │ RW
              │                              │
              ▼                              ▼
        ┌──────────────────────┐   ┌──────────────────────┐
        │ COMPUTED SIGNALS     │   │ COMPUTED SIGNALS     │
        ├──────────────────────┤   ├──────────────────────┤
        │ visibleItems()       │   │ hasMoreItems()       │
        │ = items[0..count]    │   │ = count < 9          │
        └──────────────────────┘   └──────────────────────┘
              │ READ                     │ READ
              │                         │
              ▼                         ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ RENDER TEMPLATE  │   │ SHOW/HIDE BUTTON │
        │ *ngFor items     │   │ *ngIf check      │
        └──────────────────┘   └──────────────────┘

LIFECYCLE HOOKS
───────────────
    ngOnInit()
      │
      ├─> calculateVisibleItems()
      │     ├─ Measure container width
      │     ├─ Calculate ~56px per item height
      │     └─ visibleCount.set(calculated)
      │
      └─> @HostListener('window:resize')
            └─> recalculate on resize

METHODS & INTERACTIONS
──────────────────────
    calculateVisibleItems()      toggleMoreMenu()         closeMoreMenu()
    ─────────────────────        ─────────────────        ──────────────
    Measure viewport        +    Toggle state        +   Set to false
    Calculate visible            Update signal            Close menu
    Update visibleCount          Trigger re-render        Notify user


TEMPLATE RENDERING
──────────────────
    <div class="responsive-nav-wrapper">
      
      ┌─────────────────────────────────────────┐
      │ MAIN NAVIGATION BAR                     │
      ├─────────────────────────────────────────┤
      │ *ngFor visibleItems()                   │
      │   - Dashboard     [active?]             │
      │   - Lavori        [active?]             │
      │   - (others...)                         │
      └─────────────────────────────────────────┘
      
      ┌─────────────────────────────────────────┐
      │ "ALTRO" BUTTON (if hasMoreItems)        │
      ├─────────────────────────────────────────┤
      │ ⋯ Altro                                 │
      │ (click) → toggleMoreMenu()              │
      └─────────────────────────────────────────┘
      
      ┌─────────────────────────────────────────┐
      │ MORE MENU DROPDOWN (if moreMenuOpen)    │
      ├─────────────────────────────────────────┤
      │ Header: "Altre opzioni" [Close ✕]       │
      ├─────────────────────────────────────────┤
      │ *ngFor navigationItems (ALL 9 items)    │
      │   - Dashboard     [active?]             │
      │   - Lavori        [active?]             │
      │   - Clienti       [active?]             │
      │   - Eventi        [active?]             │
      │   - Vendite       [active?]             │
      │   - Catalogo      [active?]             │
      │   - Finanza       [active?]             │
      │   - Scadenze      [active?]             │
      │   - Impostazioni  [active?]             │
      │                                         │
      │ (click item) → navigate + close menu    │
      └─────────────────────────────────────────┘
    </div>
```

---

## 3. Responsive Behavior Across Breakpoints

```
┌────────────────────────────────────────────────────────────────────┐
│ VIEWPORT SIZES & RESPONSIVE BEHAVIOR                              │
└────────────────────────────────────────────────────────────────────┘

DESKTOP (≥ 1024px)
──────────────────
    ┌─────────────────────────────────────┐
    │ Topbar (Brand + Theme Toggle)       │
    ├─────────────────────────────────────┤
    │ │                │                  │
    │ │  SIDEBAR        │   MAIN CONTENT  │
    │ │  ┌──────────┐   │   ┌──────────┐  │
    │ │  │ Dashboard│◀──┼──▶│          │  │
    │ │  │ Lavori   │   │   │ (Page)   │  │
    │ │  │ Clienti  │   │   │          │  │
    │ │  │ Eventi   │   │   │          │  │
    │ │  │ Vendite  │   │   │          │  │
    │ │  │ Catalogo │   │   │          │  │
    │ │  │ Finanza  │   │   └──────────┘  │
    │ │  │ Scadenze │   │                  │
    │ │  │Settings  │   │                  │
    │ │  └──────────┘   │                  │
    │ │                │                  │
    │ └─────────────────────────────────────┘
    │
    └─────────────────────────────────────┘

    Behavior:
    - All 9 items visible
    - visibleCount = 9
    - hasMoreItems = false
    - "Altro" button: NOT SHOWN
    - Sidebar width: 240px


TABLET (640px - 1023px)
───────────────────────
    ┌─────────────────────────────────────┐
    │ Topbar                              │
    ├─────────────────────────────────────┤
    │ │                │                  │
    │ │  SIDEBAR        │   MAIN CONTENT  │
    │ │  ┌──────────┐   │   ┌──────────┐  │
    │ │  │ Dashboard│   │   │          │  │
    │ │  │ Lavori   │   │   │ (Page)   │  │
    │ │  │ Clienti  │   │   │          │  │
    │ │  │ Vendite  │   │   │          │  │
    │ │  │ ⋯ Altro  │◀──┼──┐└──────────┘  │
    │ │  └──────────┘   │  │               │
    │ │                │  │               │
    │ │  Dropdown:      │  │               │
    │ │  ┌────────────┐ │  │               │
    │ │  │ Dashboard  │ │  │               │
    │ │  │ Lavori     │ │  │               │
    │ │  │ Clienti    │ │  │               │
    │ │  │ Eventi     │ │  │               │
    │ │  │ Vendite    │ │  │               │
    │ │  │ Catalogo   │ │  │               │
    │ │  │ Finanza    │ │  │               │
    │ │  │ Scadenze   │ │  │               │
    │ │  │ Settings   │ │  │               │
    │ │  └────────────┘ │  │               │
    │ │                │  │               │
    │ └─────────────────────────────────────┘

    Behavior:
    - 4-5 items visible (depending on height)
    - visibleCount = 4-5
    - hasMoreItems = true
    - "Altro" button: SHOWN
    - More menu: Shows ALL 9 items
    - Dropdown positioned below button


MOBILE (< 640px)
────────────────
    ┌─────────────────────────────────────┐
    │ Topbar                              │
    ├─────────────────────────────────────┤
    │                                     │
    │          MAIN CONTENT               │
    │         ┌──────────────┐            │
    │         │              │            │
    │         │   (Page)     │            │
    │         │              │            │
    │         │              │            │
    │         │              │            │
    │         │              │            │
    │         │              │            │
    │         │              │            │
    │         └──────────────┘            │
    │                                     │
    │  ┌─────────────────────────────────┐│
    │  │ ⋯ Altro (Hamburger)             ││
    │  └─────────────────────────────────┘│
    │                                     │
    └─────────────────────────────────────┘
    
    When hamburger is tapped:
    
    ┌─────────────────────────────────────┐
    │ ⋯ Altro (highlighted)               │
    ├─────────────────────────────────────┤
    │ Altre opzioni              [✕ Close]│
    ├─────────────────────────────────────┤
    │ 📊 Dashboard                        │
    │ ✓ Lavori                            │
    │ 👥 Clienti                          │
    │ 📅 Eventi                           │
    │ 💰 Vendite                          │
    │ 📦 Catalogo                         │
    │ 💳 Finanza                          │
    │ ⏰ Scadenze                         │
    │ ⚙ Impostazioni                      │
    ├─────────────────────────────────────┤
    │ (scrollable if needed)              │
    └─────────────────────────────────────┘

    Behavior:
    - Sidebar: NOT SHOWN (display: none)
    - Main content: Full width
    - "Altro" button: PROMINENT (hamburger)
    - More menu: FULLSCREEN modal from bottom
    - Height: 70vh (scrollable)
    - Animation: Slide-up 0.2s


BREAKPOINTS IN CODE
───────────────────

CSS Media Queries:
    @media (max-width: 699px) {
      /* Mobile styles */
      .sidebar { display: flex; flex-direction: row; }
      .sidebar-nav { display: none; }
      .nav-more-menu { position: fixed; bottom: 0; }
    }

    @media (min-width: 700px) {
      /* Tablet+ styles */
      .sidebar { display: flex; flex-direction: column; }
      .sidebar-nav { display: flex; flex-direction: column; }
    }

Signal Logic:
    calculateVisibleItems() {
      let count = Math.max(3, Math.floor(availableHeight / 56px));
      visibleCount.set(count);
    }

Computed Signals:
    visibleItems = computed(() => items.slice(0, visibleCount()));
    hasMoreItems = computed(() => visibleCount() < 9);
```

---

## 4. State Management & User Interactions

```
┌────────────────────────────────────────────────────────────────────┐
│ STATE MACHINE: ResponsiveNavComponent                             │
└────────────────────────────────────────────────────────────────────┘

Initial State:
    moreMenuOpen = false
    visibleCount = [calculated]
    visibleItems = [subset]
    hasMoreItems = [computed]


USER INTERACTIONS
─────────────────

Scenario 1: Desktop View - Click on "Lavori"
───────────────────────────────────────
    [User clicks "Lavori" in sidebar]
              │
              ▼
    routerLink="/works" triggered
              │
              ▼
    App navigates to /works
              │
              ▼
    Router emits navigation event
              │
              ▼
    routerLinkActive detects match
              │
              ▼
    "Lavori" link gets class="active"
              │
              ▼
    [User sees highlighted "Lavori" item]


Scenario 2: Tablet View - Click "Altro" Button
─────────────────────────────────
    [User clicks "Altro" button]
              │
              ▼
    onClick → toggleMoreMenu()
              │
              ▼
    moreMenuOpen.update(open => !open)
              │
              ▼
    moreMenuOpen = true
              │
              ▼
    *ngIf="moreMenuOpen()" renders menu
              │
              ▼
    [Dropdown menu appears with animation]
              │
              ├─────────────────────────────┐
              │                             │
    [User sees menu]            [Wait for next action]
              │
              └─────────────────┬───────────────────────┐
                                │                       │
                    Click item in menu    Click close button
                                │                       │
                                ▼                       ▼
                        router.navigate()      closeMoreMenu()
                        + closeMoreMenu()            │
                                │                    ▼
                                ▼                moreMenuOpen = false
                        moreMenuOpen = false
                        + navigate to new page
                                │
                                ▼
                        [Menu closes, navigate happens]


Scenario 3: Mobile View - Hamburger Interaction
────────────────────────────────
    [Screen is 390px wide]
              │
              ▼
    calculateVisibleItems() called
              │
              ├─ availableHeight = 600px
              ├─ itemHeight = 56px
              ├─ maxItems = Math.floor(600/56) = 10
              └─ visibleCount = Math.min(10, 1) = 1 (only hamburger button)
              │
              ▼
    hasMoreItems = computed() = true (1 < 9)
              │
              ▼
    Hamburger "Altro" button shown
              │
              ▼
    [User taps hamburger]
              │
              ▼
    toggleMoreMenu() called
              │
              ▼
    moreMenuOpen = true
              │
              ▼
    Fullscreen menu animates up
              │
              ▼
    [User sees all 9 items]
              │
              ├─ Can scroll if > 70vh
              │
              ├─ User selects item
              │     │
              │     ▼
              │  Navigate + closeMoreMenu()
              │
              └─ Or user taps close button
                    │
                    ▼
                 closeMoreMenu()


KEYBOARD INTERACTIONS
─────────────────────

Tab Navigation:
    [Press Tab repeatedly]
        │
        ├─ Focus on Logo "AB"
        ├─ Focus on Theme button "🌗"
        ├─ Focus on first nav item (if visible)
        ├─ Focus on next nav item
        ├─ Focus on "Altro" button (if shown)
        ├─ (menu not in focus order until opened)
        │
        └─ Repeat...

More Menu - Tab Inside:
    [Menu is open, press Tab]
        │
        ├─ Focus on menu header "Altre opzioni"
        ├─ Focus on close button "✕"
        ├─ Focus on first menu item
        ├─ Focus on next menu items
        ├─ Focus cycles through all 9 items
        │
        └─ Focus on close button again (cycle)

Enter/Space on Link:
    [Tab to "Lavori" link]
        │
        ▼
    Press Enter or Space
        │
        ▼
    Link activated
        │
        ▼
    Navigate to /works


SCREEN READER ANNOUNCEMENTS
──────────────────────────────

Button "Altro":
    Announced as: "Altro, button, menu"
    When opened: "aria-expanded true"
    When closed: "aria-expanded false"

More Menu Container:
    Announced as: "menu"
    Items announced as: "menu items"

Active Links:
    Announced with current page context
    Example: "Lavori, link, current page"
```

---

## 5. CSS Cascade & Theming

```
┌────────────────────────────────────────────────────────────────────┐
│ CSS VARIABLE INHERITANCE & THEMING                                │
└────────────────────────────────────────────────────────────────────┘

Global Variables (app.css or styles.css):
─────────────────────────────────
    html {
      --color-text-primary: #2C2C2C;
      --color-surface-tertiary: #F0F0F0;
      --color-accent: #0B8FA0;
      --color-border: #E0E0E0;
      --font-weight-semibold: 600;
      --radius-base: 8px;
      --transition-base: all 0.2s ease;
      /* etc */
    }

    html[data-theme="dark"] {
      --color-text-primary: #FFFFFF;
      --color-surface-tertiary: #333333;
      --color-accent: #00D4E8;
      --color-border: #444444;
    }

    html[data-theme="artist"] {
      --color-text-primary: #2C2C2C;
      --color-surface-tertiary: #FFF8E6;
      --color-accent: #C41D7F;
      /* Magenta accent */
    }


Component Styles (responsive-nav.component.ts):
──────────────────────────────────────────────
    .nav-item {
      color: var(--color-text-primary);        ◀── Uses global
      border-radius: var(--radius-base);       ◀── Uses global
      transition: all var(--transition-base);  ◀── Uses global
      /* ... */
    }

    .nav-item:hover {
      background-color: var(--color-surface-tertiary);  ◀── Uses global
    }

    .nav-item.active {
      border-left-color: var(--color-accent);  ◀── Uses global
      font-weight: var(--font-weight-semibold);◀── Uses global
    }


Theme Switching Flow:
────────────────────
    [User clicks Theme Toggle Button]
              │
              ▼
    Theme event triggered
              │
              ▼
    JavaScript updates: html[data-theme]
              │
              ├─ Before: data-theme="light"
              └─ After: data-theme="dark"
              │
              ▼
    CSS Variables automatically update
              │
              ├─ --color-text-primary changes
              ├─ --color-surface-tertiary changes
              ├─ --color-accent changes
              └─ All other variables update
              │
              ▼
    All components re-render with new colors
              │
              ├─ Nav items change colors
              ├─ Buttons change appearance
              ├─ Hover states update
              └─ Active states update
              │
              ▼
    [User sees instant theme transition]


Cascade Example:
────────────────

HTML:
    <html data-theme="light">
      <body>
        <div class="nav-item active">Lavori</div>
      </body>
    </html>

CSS Resolution:
    .nav-item {
      color: var(--color-text-primary);
      /* Resolves to: #2C2C2C (light theme) */
    }

    .nav-item.active {
      border-left-color: var(--color-accent);
      /* Resolves to: #0B8FA0 (light theme) */
    }

    /* When theme changes to dark: */

    html[data-theme="dark"] {
      --color-text-primary: #FFFFFF;
      --color-accent: #00D4E8;
    }

    /* Same .nav-item.active class now resolves to: */
    border-left-color: #00D4E8 /* Dark theme accent */


Performance:
    • No style recalculation for all elements
    • Only CSS variables update (efficient)
    • Instant visual feedback (no re-render needed)
    • Works across all components simultaneously
```

---

## 6. Error Handling & Fallbacks

```
┌────────────────────────────────────────────────────────────────────┐
│ ERROR SCENARIOS & RECOVERY                                        │
└────────────────────────────────────────────────────────────────────┘

Scenario 1: 404.html Script Fails
──────────────────────────────────
    Browser requests: /dashboard
              │
              ▼
    GitHub Pages: Not found → serve 404.html
              │
              ▼
    404.html loads, but:
    • JavaScript disabled?
    • Script syntax error?
    • Network error?
              │
              ▼
    Fallback behavior:
    • 404.html displays error message
    • User sees: "Page not found"
    • User can click link to return home
    • Or manually type URL


Scenario 2: App Component Fails to Process Redirect
───────────────────────────────────────────────────
    404.html redirect works:
    /?redirect=%2Fdashboard loaded ✓
              │
              ▼
    App component initializes
              │
              ▼
    Effect hook throws error?
    • Router service fails?
    • QueryParams undefined?
              │
              ▼
    App still renders:
    • Router outlet shows current route
    • User on root page
    • Can navigate manually via menu
              │
              ▼
    Browser console shows error
    Dev can debug


Scenario 3: Responsive Component Fails
──────────────────────────────────────
    ResponsiveNavComponent initialization fails:
              │
              ├─ calculateVisibleItems() error
              ├─ Signal update fails
              ├─ Template rendering error
              │
              ▼
    Fallback in template:
    *ngIf and *ngFor handle null/undefined
              │
              ▼
    App doesn't crash
              │
              ▼
    Empty nav or partial render
              │
              ▼
    User can still navigate via URL


Scenario 4: CSS Variable Not Defined
────────────────────────────────────
    .nav-item {
      color: var(--color-text-primary);
      color: #2C2C2C; /* Fallback */
    }
              │
              ▼
    If --color-text-primary undefined:
    • CSS spec: use fallback value
    • Renders as: #2C2C2C
    • No visual break
    • Graceful degradation


Scenario 5: Mobile Breakpoint Calculation Wrong
────────────────────────────────────────────────
    calculateVisibleItems():
              │
              ├─ navContainer is null?
              ├─ offsetWidth is 0?
              ├─ Division by zero?
              │
              ▼
    Guards prevent errors:
    if (!this.navContainer) return;
    if (!container) return;
              │
              ▼
    visibleCount stays unchanged
              │
              ▼
    Component re-renders with previous state
              │
              ▼
    No visible issue to user
              │
              ▼
    Next resize event may fix it


TESTING ERROR SCENARIOS
───────────────────────
    1. Disable JavaScript, load page
       → 404.html shows fallback
    
    2. Network throttle to "Offline"
       → Service worker response (if enabled)
       → Or cached version
    
    3. Remove CSS variables from <html>
       → Fallback colors used
    
    4. Set viewport height to 0
       → calculateVisibleItems guards catch it
    
    5. Delete APP_NAVIGATION_ITEMS array
       → *ngFor has null check
       → Component doesn't crash
```

---

## Summary

These diagrams provide a complete visual reference for:

✅ **GitHub Pages SPA routing flow** - How deep-links are handled
✅ **Component architecture** - Signals, computed properties, reactivity
✅ **Responsive breakpoints** - Desktop, tablet, mobile behaviors
✅ **State management** - User interactions and state transitions
✅ **CSS theming** - Variable cascade and theme switching
✅ **Error handling** - Fallbacks and graceful degradation

Use these diagrams during development, debugging, and documentation.
