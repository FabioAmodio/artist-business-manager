# Quick Reference Guide: Navigation & Routing

> Aggiornata al 2026-09-01. Per lo stato complessivo corrente vedere `docs/architecture/IMPLEMENTATION-STATUS.md`.

## For Developers: Jump-Start Implementation

---

## 1️⃣ File Locations & Purpose

### Core Implementation Files

```
src/app/
├── app.ts                          ← Router redirect handling
├── app.html                        ← Uses <app-responsive-nav>
├── app.scss                        ← Shell e media queries (700px breakpoint)
└── core/navigation/
    ├── app-navigation-config.ts    ← 12 navigation items defined
    └── responsive-nav.component.ts ← Responsive menu component
```

### Documentation Files

```
docs/
├── COMPLETION-CHECKLIST.md         ← Overall status
├── IMPLEMENTATION-COMPLETE-SUMMARY.md ← Overview
├── TECHNICAL-DIAGRAMS.md           ← Visual reference
├── architecture/
│   └── NAVIGATION-ROUTING-IMPLEMENTATION.md ← Technical details
└── testing/
    └── NAVIGATION-RESPONSIVE-TEST-GUIDE.md ← 50+ test cases
```

---

## 2️⃣ Quick Configuration Changes

### Add a New Navigation Item

**File:** `src/app/core/navigation/app-navigation-config.ts`

```typescript
export const APP_NAVIGATION_ITEMS: NavigationItem[] = [
  // ... existing items
  { path: '/new-page', label: 'Nuova Pagina', icon: '🆕' },
];
```

### Change Mobile Breakpoint

**File:** `src/app/app.scss`

```css
@media (max-width: 699px) {  ← Change this number
  /* Mobile styles */
}

@media (min-width: 700px) {  ← And this one
  /* Desktop styles */
}
```

### Change Theme Colors

**File:** `styles.css` or root theme

```css
html {
  --color-accent: #0B8FA0;        ← Main accent
  --color-surface-tertiary: #F0F0F0;  ← Hover background
  --color-text-primary: #2C2C2C;  ← Text color
}

html[data-theme="dark"] {
  --color-accent: #00D4E8;
  --color-surface-tertiary: #333333;
  --color-text-primary: #FFFFFF;
}
```

---

## 3️⃣ Common Tasks

### Test Deep-Link Routing Locally

```bash
# Start dev server
npm start

# Navigate to (in address bar)
http://localhost:4200/artist-business-manager/dashboard
http://localhost:4200/artist-business-manager/works
http://localhost:4200/artist-business-manager/clients

# Should work without errors
```

### Test Deep-Link Routing on GitHub Pages

```bash
# After deploying to GitHub Pages
https://username.github.io/artist-business-manager/dashboard
https://username.github.io/artist-business-manager/works

# Should work without 404 errors
```

### Test Responsive Menu

```bash
# Option 1: Use DevTools
# Press F12 → Ctrl+Shift+M → Adjust viewport size

# Option 2: Test on real mobile
# Mobile (<700px): action bar fissa con Home, Eventi, FAB, Catalogo e Altro
# Desktop/tablet (>=700px): sidebar con tutte le voci
```

### Debug Navigation Issues

```typescript
// In component or console:
const router = inject(Router);
router.navigate(['/dashboard']);

// Check if redirect param is present:
const route = inject(ActivatedRoute);
console.log(route.snapshot.queryParams);  // Should show redirect param
```

---

## 4️⃣ Component API Reference

### ResponsiveNavComponent

**Location:** `src/app/core/navigation/responsive-nav.component.ts`

**Inputs:** None (uses injection)

**Outputs:** None (handles routing internally)

**Public Methods:**
```typescript
toggleMoreMenu(): void     // Open/close the "Altro" menu
closeMoreMenu(): void      // Close the menu
calculateVisibleItems(): void  // Recalculate visibility (called on resize)
```

**Signals:**
```typescript
navigationItems: NavigationItem[]  // List of menu items (12 items)
moreMenuOpen: Signal<boolean>      // Is "Altro" menu open?
visibleItems: Signal<NavigationItem[]>  // Items visible in sidebar
hasMoreItems: Signal<boolean>      // Should show "Altro" button?
```

**Events:**
- `routerLink` click → navigates to page
- `closeMoreMenu()` called automatically on navigation
- `window:resize` → recalculates visibility

---

## 5️⃣ Styling Reference

### Component CSS Classes

```css
.responsive-nav-wrapper    /* Container for nav */
.sidebar-nav              /* Main navigation bar */
.nav-item                 /* Individual navigation item */
.nav-item.active          /* Active/current item */
.nav-more-button          /* Pulsante "Altro" */
.nav-more-menu            /* Dropdown menu container */
.more-menu-header         /* Menu title section */
.more-menu-item           /* Item inside dropdown */
.more-menu-item.active    /* Active item in dropdown */
```

### Key CSS Variables

```css
--color-text-primary           /* Text color */
--color-surface-tertiary       /* Hover background */
--color-accent                 /* Active indicator */
--color-border                 /* Divider lines */
--font-weight-semibold         /* Bold text */
--radius-base                  /* Rounded corners */
--transition-base              /* Animation timing */
```

---

## 6️⃣ Debugging Checklist

### "Deep-link doesn't work"

- [ ] Check `angular.json` has `baseHref: "/artist-business-manager/"`
- [ ] Verify `public/404.html` exists and has redirect script
- [ ] Check `src/app/app.ts` has effect() with redirect handling
- [ ] Test in browser console: `window.location.pathname`
- [ ] Check `queryParams['redirect']` in app.ts effect

### "Menu doesn't show on mobile"

- [ ] Check breakpoint in `app.scss` (`@media (max-width: 699px)`)
- [ ] Verify `<app-mobile-action-bar>` is rendered
- [ ] Check CSS: `.mobile-bar { position: fixed; }`
- [ ] Test with DevTools device emulation
- [ ] Check `hasMoreItems()` is true

### "Items aren't highlighted as active"

- [ ] Verify `routerLink` paths match exactly (case-sensitive)
- [ ] Check `routerLinkActive="active"` is on link elements
- [ ] Verify routes in `app.routes.ts` match config paths
- [ ] Check CSS `.nav-item.active` has background color
- [ ] Test with direct URL navigation, not menu clicks

### "Styling looks wrong"

- [ ] Check CSS variables are defined in root `:root {}`
- [ ] Verify `app.scss` has the shell media queries
- [ ] Check component external SCSS is loaded
- [ ] Verify theme data attribute: `<html data-theme="light">`
- [ ] Clear browser cache (Ctrl+Shift+Delete)

---

## 7️⃣ Testing Commands

### Quick Build Test

```bash
npm run build

# Expected output:
# ✅ Build successful
# ⚠️ 1 CSS budget warning (acceptable)
# ✅ No errors
```

### Check TypeScript

```bash
npx tsc --noEmit

# Expected output:
# ✅ No errors found
```

### Run on Localhost

```bash
npm start

# Navigate to:
# http://localhost:4200

# Test:
# 1. Menu is visible
# 2. Clicking items navigates
# 3. Active state highlights current page
# 4. Resize browser → sidebar/action bar switch at 700px
```

---

## 8️⃣ Performance Tips

### Optimization Opportunities

1. **Lazy Load Navigation Config**
   ```typescript
   // Instead of importing directly
   const config = await import('./app-navigation-config');
   ```

2. **Use ResizeObserver Instead of Timeout**
   ```typescript
   const observer = new ResizeObserver(() => {
     this.calculateVisibleItems();
   });
   observer.observe(this.navContainer.nativeElement);
   ```

3. **Memoize Visibility Calculation**
   ```typescript
   private lastViewportWidth = 0;
   calculateVisibleItems() {
     const width = window.innerWidth;
     if (width === this.lastViewportWidth) return;
     this.lastViewportWidth = width;
     // Calculate...
   }
   ```

### Monitor Performance

```bash
# Build size analysis
npm run build
# Check output for bundle size

# Chrome DevTools:
# 1. Open Performance tab
# 2. Record page load
# 3. Check for long tasks
# 4. Verify animations are 60fps
```

---

## 9️⃣ Accessibility Checklist

### For Testing / QA

- [ ] Tab through all menu items - should work
- [ ] Every button has `aria-label`
- [ ] Menu button shows `aria-expanded` state
- [ ] Menu has `role="menu"` attribute
- [ ] Menu items have `role="menuitem"`
- [ ] Focus outline is visible (2px) on all elements
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Keyboard users can navigate and select items
- [ ] Screen reader announces menu correctly

### Test with Screen Reader

```bash
# Windows: NVDA (free)
# macOS: VoiceOver (built-in, Cmd+F5)
# Linux: Orca (built-in)

# Test: "Dashboard, link, current page"
# Test: "Altro, button, menu, collapsed"
# Test: When menu opens: "aria-expanded true"
```

---

## 🔟 Deployment Checklist

### Pre-Deployment

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No console errors (CSS warning is OK)
- [ ] All 12 navigation items work locally
- [ ] Deep-links work on localhost (`http://localhost:4200/artist-business-manager/dashboard`)
- [ ] Mobile/tablet/desktop responsive
- [ ] Accessibility audit passes

### Deployment Steps

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   ```bash
   # Option A: Manual push to gh-pages branch
   # Option B: GitHub Actions CI/CD
   # Option C: Deploy service
   ```

3. **Verify on GitHub Pages**
   ```bash
   # Test deep-links:
   https://username.github.io/artist-business-manager/dashboard
   https://username.github.io/artist-business-manager/works
   
   # Test responsive:
   # Mobile device or DevTools device emulation
   ```

### Rollback Plan

```bash
# If something breaks:
# 1. Revert commits to previous working version
# 2. Or push previous build to GitHub Pages
# 3. Check browser cache is cleared

git log --oneline
git revert <commit-hash>
npm run build
# Re-deploy
```

---

## 📞 Quick Reference Tables

### Breakpoints

| Size | Width | Behavior |
|------|-------|----------|
| Mobile | < 700px | Action bar fissa + menu Altro |
| Tablet/Desktop | ≥ 700px | Sidebar con tutte le voci |

### Navigation Items (12 total)

| # | Path | Label | Icon |
|---|------|-------|------|
| 1 | /dashboard | Riepilogo | 📊 |
| 2 | /sales | Vendite | 💰 |
| 3 | /works | Lavori | ✓ |
| 4 | /deadlines | Scadenze | ⏰ |
| 5 | /clients | Clienti | 👥 |
| 6 | /catalog | Catalogo | 📦 |
| 7 | /purchases | Acquisti | ＋ |
| 8 | /suppliers | Fornitori | ▣ |
| 9 | /events | Eventi | 📅 |
| 10 | /payment-methods | Pagamenti | ▤ |
| 11 | /settings | Impostazioni | ⚙ |
| 12 | /trash | Cestino | 🗑 |

### ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| "Altro" button | aria-label | "Mostra altri elementi..." |
| "Altro" button | aria-haspopup | "menu" |
| "Altro" button | aria-expanded | true/false |
| Menu container | role | "menu" |
| Menu items | role | "menuitem" |

---

## 🎯 One-Minute Setup

For a new developer:

1. **Read:** `IMPLEMENTATION-COMPLETE-SUMMARY.md` (2 min overview)
2. **See:** `TECHNICAL-DIAGRAMS.md` (understand flow)
3. **Check:** `app-navigation-config.ts` (where items are defined)
4. **Review:** `responsive-nav.component.ts` (component code)
5. **Run:** `npm start` (see it working)
6. **Resize:** Browser window (watch responsive behavior)
7. **Test:** Click all menu items (verify navigation)

Done! Now familiar with implementation. 🚀

---

## 📖 Full Documentation Map

```
You are here (Quick Reference)
    ↓
Want technical details?
    → Read: NAVIGATION-ROUTING-IMPLEMENTATION.md
    
Want to see architecture?
    → Read: TECHNICAL-DIAGRAMS.md
    
Want to test?
    → Read: NAVIGATION-RESPONSIVE-TEST-GUIDE.md
    
Want project overview?
    → Read: IMPLEMENTATION-COMPLETE-SUMMARY.md
    
Want implementation status?
    → Read: COMPLETION-CHECKLIST.md
    
Want to modify code?
    → Edit: app-navigation-config.ts (config changes)
    → Edit: responsive-nav.component.ts (component changes)
    → Edit: app.scss (styling changes)
```

---

**Last Updated:** Implementation Complete ✅
**Status:** Production Ready 🚀
**Questions?** Check appropriate documentation file above
