---
name: SalaryBridge Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424654'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737785'
  outline-variant: '#c2c6d6'
  surface-tint: '#0057cc'
  primary: '#0047a9'
  on-primary: '#ffffff'
  primary-container: '#0b5ed7'
  on-primary-container: '#dae2ff'
  inverse-primary: '#b0c6ff'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#7cf994'
  on-secondary-container: '#007230'
  tertiary: '#6d4400'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e5900'
  on-tertiary-container: '#ffddb8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00419d'
  secondary-fixed: '#7ffc97'
  secondary-fixed-dim: '#62df7d'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-balance:
    fontFamily: Public Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-balance-mobile:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  currency-symbol:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-mobile: 16px
  container-margin-desktop: 32px
  gutter: 24px
  section-gap: 40px
---

## Brand & Style
The design system is engineered to bridge the gap between institutional stability and modern financial agility. It serves Ugandan public servants—a demographic that values security, official recognition, and clarity. The visual language is **Modern Fintech SaaS** with a "Human-Institutional" hybrid approach: it feels as reliable as a government entity but as accessible as a consumer app.

The emotional core of the system is **Empathetic Professionalism**. It avoids the coldness of traditional banking by using generous whitespace, soft edges, and a warm color palette. The style utilizes **Minimalism** to reduce cognitive load during financial stress, paired with **Tactile** surfaces (soft shadows and subtle gradients) that make digital interactions feel tangible and safe.

## Colors
This design system utilizes a high-trust palette rooted in **Deep Blue (#0B5ED7)** for authority and navigation, and **Emerald Green (#16A34A)** for financial growth and transactional actions. 

- **Primary Deep Blue**: Used for headers, primary buttons, and institutional branding.
- **Primary Emerald Green**: Reserved for "Access Funds," "Withdraw," and positive balance indicators.
- **Warm Accents**: We use a sun-drenched Amber for alerts and a soft Mint for success states to keep the interface feeling helpful rather than punitive.
- **Neutrals**: A range of cool grays (Slate) provides structure without the harshness of pure black, maintaining a soft, approachable dashboard environment.

## Typography
The system lead font is **Public Sans**, chosen for its origins in government design systems—conveying accessibility and official status. It is paired with **Work Sans** for labels to provide a clean, slightly more technical feel for data-heavy sections.

Financial amounts (UGX) must be rendered with **Display Balance** styling, featuring tighter letter spacing and heavier weights to ensure the user's available wage is the primary focal point of the screen. We use specific label-caps for "Verification Marks" and "Government IDs" to distinguish between user data and system-verified data.

## Layout & Spacing
The layout follows a **responsive-first, fluid-to-fixed** approach. 

- **Mobile**: A single-column layout with a fixed **Bottom Navigation** bar for thumb-friendly access to "Home," "Withdraw," "History," and "Profile."
- **Desktop**: A 12-column grid with a fixed **Sidebar Navigation** (280px). 
- **Rhythm**: We use an 8px linear scale. Dashboard cards are separated by 24px gutters to allow the "Soft Shadow" elevation to breathe, preventing the UI from feeling cluttered. Content containers have a maximum width of 1200px on desktop to maintain readability.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Ambient Shadows** rather than harsh lines. 

1. **Surface Level (Level 0)**: The main background is pure White (#FFFFFF).
2. **Card Level (Level 1)**: Light Gray (#F8FAFC) cards with a 1px border (#E2E8F0) and a very soft, diffused shadow (Offset: 0, 4; Blur: 20; Opacity: 0.04; Color: Deep Blue).
3. **Interactive Level (Level 2)**: Buttons and active state cards utilize a slightly more pronounced shadow to invite interaction.

We use **Subtle Gradients** on primary action buttons (e.g., Deep Blue to a slightly lighter blue) to give a "raised" feel that suggests the button is physically pressable.

## Shapes
The shape language is defined by **Large Radii (Rounded)**. This softness counteracts the "stiff" reputation of government services.

- **Standard Cards/Modals**: 16px (1rem) corner radius.
- **Buttons**: 12px (0.75rem) to maintain a balance between friendly and professional.
- **Status Badges**: Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Input Fields**: 8px (0.5rem) to ensure they feel precise and structured.

## Components

### Navigation
- **Sidebar Nav (Desktop)**: Deep Blue background with White icons. Active states use an Emerald Green left-accent bar.
- **Bottom Nav (Mobile)**: White background with a subtle top border. The "Withdraw" or "Bridge" action is the central, floating action button in Emerald Green.

### Feedback & Indicators
- **Status Badges**: Used for loan status (e.g., "Pending," "Approved," "Repaid"). Use low-saturation background tints of the warm accent colors with high-saturation text.
- **Government Verification Marks**: A specific component combining a small Shield icon with "Verified Public Servant" text in Work Sans caps. This must appear next to the user profile and on official statements.

### Data Entry & Action
- **Currency Inputs**: Large, centered text with a fixed "UGX" prefix. The focus state uses a 2px Emerald Green glow.
- **Action Cards**: Dashboard cards that display "Earned to Date" or "Available for Withdrawal." These use the Emerald Green for the primary numerical figure.
- **Buttons**: Primary buttons are Deep Blue. High-priority financial actions (Withdraw) use Emerald Green. All buttons have a 600 weight font.