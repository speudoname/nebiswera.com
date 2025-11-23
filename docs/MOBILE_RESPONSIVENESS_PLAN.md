# Mobile Responsiveness Implementation Plan

## Overview
Make the entire site mobile-first and fully responsive across all breakpoints.

**Approach:** Mobile-first (base styles for mobile, then `md:`, `lg:` for larger screens)

**Breakpoints:**
- Base: 0-639px (mobile)
- `sm`: 640px+ (large mobile)
- `md`: 768px+ (tablet)
- `lg`: 1024px+ (desktop)
- `xl`: 1280px+ (large desktop)

---

## Phase 1: Global Foundation
Update centralized styles to be mobile-first.

### 1.1 Typography (globals.css)
- [ ] Reduce base heading sizes for mobile
- [ ] Add responsive scaling with `md:` and `lg:` prefixes
- [ ] Ensure line-heights are comfortable on mobile
- [ ] Update `.hero-title`, `.eyebrow`, `.display-*` classes

### 1.2 Spacing & Containers
- [ ] Review and standardize container padding
- [ ] Create responsive spacing utilities if needed

---

## Phase 2: Layout Components

### 2.1 PublicHeader (src/components/layout/PublicHeader.tsx)
- [ ] Create MobileMenu component with hamburger icon
- [ ] Hide nav buttons on mobile, show hamburger
- [ ] Implement slide-out or dropdown menu
- [ ] Ensure touch-friendly tap targets (min 44px)

### 2.2 PublicFooter (src/components/layout/PublicFooter.tsx)
- [ ] Stack links vertically on mobile
- [ ] Center-align on mobile, spread on desktop
- [ ] Reduce gap between links on mobile

### 2.3 AppHeader (src/components/layout/AppHeader.tsx)
- [ ] Apply same mobile menu pattern as PublicHeader
- [ ] Ensure user dropdown works on mobile

---

## Phase 3: Public Pages

### 3.1 Home Page (src/app/[locale]/(public)/HomeClient.tsx)
- [ ] Reduce padding on mobile (`p-4 md:p-8`)
- [ ] Adjust max-width for mobile
- [ ] Ensure buttons stack on very small screens
- [ ] Review eyebrow and title sizing

### 3.2 About Page (src/app/[locale]/(public)/about/page.tsx)
- [ ] Review card padding
- [ ] Ensure content is readable on mobile

### 3.3 Contact Page (src/app/[locale]/(public)/contact/page.tsx)
- [ ] Review layout and form (if any)

### 3.4 Privacy & Terms Pages
- [ ] Ensure long text is readable on mobile
- [ ] Review paragraph spacing

---

## Phase 4: Auth Pages

### 4.1 Auth Layout (src/app/[locale]/auth/layout.tsx)
- [ ] Review padding and centering
- [ ] Ensure form cards fit mobile screens

### 4.2 Login/Register Forms
- [ ] Ensure inputs are full-width on mobile
- [ ] Review button sizes
- [ ] Check form validation messages

### 4.3 Other Auth Pages
- [ ] Forgot password, reset password, verify email
- [ ] Ensure consistent mobile experience

---

## Phase 5: Authenticated Pages

### 5.1 Dashboard (src/app/[locale]/(authenticated)/dashboard/page.tsx)
- [ ] Review card layouts
- [ ] Ensure stats/metrics stack on mobile

### 5.2 Profile (src/app/[locale]/(authenticated)/profile/page.tsx)
- [ ] Review form layout
- [ ] Ensure settings are accessible on mobile

---

## Phase 6: Testing & Polish

### 6.1 Cross-browser Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on desktop browsers

### 6.2 Touch Interactions
- [ ] Ensure all interactive elements have proper touch targets
- [ ] Review hover states (convert to active states on mobile)

### 6.3 Performance
- [ ] Check for layout shifts on mobile
- [ ] Ensure images are responsive

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | ✅ Complete | Global typography updated for mobile-first |
| Phase 2 | ✅ Complete | MobileMenu + responsive header/footer |
| Phase 3 | ✅ Complete | Public pages responsive |
| Phase 4 | ✅ Complete | Auth pages responsive |
| Phase 5 | ✅ Complete | Dashboard + Profile responsive |
| Phase 6 | ⏳ Pending | Testing (manual) |

---

## Files Modified

*(Updated as we progress)*

- `src/app/globals.css`
- `src/components/layout/PublicHeader.tsx`
- `src/components/layout/PublicFooter.tsx`
- `src/components/layout/MobileMenu.tsx` (new)
- ...
