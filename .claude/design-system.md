# Design System

## Neomorphic Design

The app uses a neomorphic (soft UI) design with a purple/lavender pastel color scheme.

**Key Principles:**
- Soft shadows create depth (raised and inset states)
- Consistent lavender background (`bg-neu-base`)
- Purple accent colors for interactive elements
- Rounded corners throughout (`rounded-neu`, `rounded-neu-md`)

## Color Palette

```
Primary Purple:  #8B5CF6 (primary-500)
Background:      #E8E0F0 (neu-base)
Text Primary:    #2D1B4E (text-primary)
Text Secondary:  #5B4478 (text-secondary)
```

## Shadow Classes

```tsx
// Raised elements (buttons, cards)
shadow-neu-sm    // Subtle raised
shadow-neu       // Default raised
shadow-neu-md    // Medium raised
shadow-neu-lg    // Large raised

// Pressed/inset elements (inputs, pressed buttons)
shadow-neu-inset-sm
shadow-neu-inset
shadow-neu-inset-md

// Interactive states
hover:shadow-neu-hover
active:shadow-neu-pressed
```

## Component Usage

```tsx
// Card with neomorphic shadow
<Card variant="raised" padding="md">Content</Card>

// Button with neomorphic styling
<Button variant="primary">Click me</Button>

// Input with inset shadow
<Input label="Email" placeholder="you@example.com" />
```

## Background Colors

- `bg-neu-base` - Main background (#E8E0F0)
- `bg-neu-light` - Lighter variant
- `bg-neu-dark` - Darker variant (for borders/dividers)

## Icons

**ALWAYS use Lucide React icons.** Never use other icon libraries or inline SVGs.

```tsx
import { User, Settings, LogOut } from 'lucide-react'

<User className="w-5 h-5" />
<Settings size={20} />
```

Browse icons at: https://lucide.dev/icons
