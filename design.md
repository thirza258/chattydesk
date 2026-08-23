# Design Specification: "Paper & Ink" Light Mode & Semantic Landing Page

**Document Status:** Ready for Review & Implementation  
**Target:** ChattyDesk Frontend (`chattydesk`)  
**Scope:** Landing Page Overhaul, Global Light Theme Foundation, and Elimination of DOM `<span />` Pollution

---

## 1. Executive Summary & Goals

### 1.1 Problem Statement
The current ChattyDesk frontend incorporates design anti-patterns that detract from product maturity and user experience:
1. **Generic "Dark Blue AI" Template:** The landing page and core UI rely on dark slate backgrounds (`bg-slate-950`), diffuse blue radial glows (`blur-[120px]`), neon blue button styles, and sparkle icons (`IconSparkles`). This produces a derivative look common among generic AI wrappers rather than a focused, professional developer client.
2. **DOM Pollution / "Random Spans":** Hundreds of redundant `<span>` elements wrap single text strings in buttons, links, headings, and lists (e.g. `<Link><span>Click</span></Link>`, `<span>Anthropic</span><span>·</span><span>OpenAI</span>`). These bloat the DOM tree, complicate CSS specificity, degrade screen reader accessibility, and violate semantic HTML principles.
3. **Design Inconsistency:** While `NavBar.tsx` and `Compare.tsx` introduced the **"Paper & Ink"** light editorial design system, `Landing.tsx`, `App.css`, and `AuthShell.tsx` remained trapped in the dark blue mode. Furthermore, `tailwind.config.js` was never updated to supply the custom color classes (`bg-paper`, `text-ink`, `bg-rust`, `border-hairline`), leading to missing styles.

### 1.2 Core Objectives
- **Eliminate Generic "Blue AI" Dark Mode:** Transition the entire landing page and application baseline to a high-contrast, distraction-free **"Paper & Ink" Light Editorial Theme**.
- **Remove All Arbitrary `<span>` Tags:** Replace arbitrary span wrappers with clean, semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<figure>`, `<ol>`, `<ul>`, `<li>`, `<code>`, `<time>`, `<kbd>`, `<p>`).
- **Harmonize Tailwind Theme Configuration:** Formally configure the Paper & Ink tokens in `tailwind.config.js` to ensure 100% style consistency across all components.
- **Improve Accessibility & Contrast:** Ensure all typography and interactive controls achieve WCAG AAA contrast ratios with crisp tactile borders (2px solid ink) and hard offset retro shadows (`shadow-[4px_4px_0_0_#C6BEA8]`).

---

## 2. Design System: "Paper & Ink" Editorial Language

Inspired by high-quality type specimen catalogs, Swiss modernist grid design, and physical print publications, the **"Paper & Ink"** aesthetic prioritizes typography, content hierarchy, and tactile clarity over superficial visual effects (such as neon glows or glassmorphism).

### 2.1 Design Principles

| Principle | Deprecated "Blue AI" Dark Mode | "Paper & Ink" Light Mode (New Standard) |
|---|---|---|
| **Visual Atmosphere** | Dark void (`bg-slate-950`), glowing radial blurs | Warm parchment/paper canvas (`#F9F8F5`), crisp white cards (`#FFFFFF`) |
| **Typography Hierarchy** | Slate-100 to Slate-500, low text contrast | High-contrast deep ink (`#18181B`), warm body soft ink (`#52525B`) |
| **Borders & Elevation** | Subtle 1px slate-800 borders, diffuse dark drop shadows | Bold 2px tactile ink rules (`#18181B`), hard-edge offset shadows (`4px 4px 0 0`) |
| **Accent Colors** | Generic electric blue (`#2563eb` / `#3b82f6`) | Terracotta rust (`#C2410C` / `#9A3412`) and forest pine (`#15803D`) |
| **Iconography** | Sparkle stars (`IconSparkles`), decorative dots | Geometric functional glyphs, numeric counters (`01`, `02`, `03`) |
| **DOM Semantics** | Nested span soup within buttons, headers, lists | Strict HTML5 semantic structure with semantic tags |

---

## 3. Color Tokens & Theme Configuration

### 3.1 Color Palette Table

| Token Name | Tailwind Class | Hex Code | Primary Usage |
|---|---|---|---|
| **Paper Base** | `bg-paper` | `#F9F8F5` | Main application & landing page background canvas |
| **Paper Raised** | `bg-paper-raised` | `#FFFFFF` | Feature cards, modal surfaces, window preview surfaces |
| **Paper Sunken** | `bg-paper-sunken` | `#EFECE6` | Code blocks, tables, provider bar, input frames, badges |
| **Ink** | `text-ink` / `border-ink` / `bg-ink` | `#18181B` | Primary headings, button backgrounds, 2px tactile borders |
| **Ink Soft** | `text-ink-soft` | `#52525B` | Readable body prose, subheadings, card descriptions |
| **Ink Faint** | `text-ink-faint` | `#8C887B` | Metadata, timestamps, token counts, uppercase kicker labels |
| **Rust** | `bg-rust` / `text-rust` | `#C2410C` | Primary interactive accents, hover states, step numbers |
| **Rust Deep** | `hover:text-rust-deep` | `#9A3412` | Active link states, focused borders |
| **Rust Soft** | `bg-rust-soft` | `#FFF7ED` | Highlighted row backgrounds, active pill tint |
| **Pine** | `text-pine` / `bg-pine` | `#15803D` | "Free" model badges, status indicators, success confirmations |
| **Pine Soft** | `bg-pine-soft` | `#F0FDF4` | Free-tier badge background tint |
| **Ember** | `text-ember` / `border-ember` | `#B91C1C` | Error banners, validation failures, model outage warnings |
| **Ember Soft** | `bg-ember-soft` | `#FEF2F2` | Error banner background container |
| **Hairline** | `border-hairline` | `#E4E2DC` | Subtle horizontal rules, secondary card separators |
| **Hairline Strong**| `border-hairline-strong`| `#CBC7BD` | Secondary button outlines, input inactive borders |

### 3.2 Required `tailwind.config.js` Update

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F9F8F5',
          raised: '#FFFFFF',
          sunken: '#EFECE6',
        },
        ink: {
          DEFAULT: '#18181B',
          soft: '#52525B',
          faint: '#8C887B',
        },
        rust: {
          DEFAULT: '#C2410C',
          deep: '#9A3412',
          soft: '#FFF7ED',
        },
        pine: {
          DEFAULT: '#15803D',
          soft: '#F0FDF4',
        },
        ember: {
          DEFAULT: '#B91C1C',
          soft: '#FEF2F2',
        },
        hairline: {
          DEFAULT: '#E4E2DC',
          strong: '#CBC7BD',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Newsreader',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        tactile: '4px 4px 0 0 #C6BEA8',
        'tactile-sm': '2px 2px 0 0 #C6BEA8',
        'tactile-lg': '6px 6px 0 0 #C6BEA8',
      },
    },
  },
  plugins: [],
};
```

### 3.3 Required Global CSS (`src/renderer/App.css`) Adjustments

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color-scheme: light;
  }

  body {
    @apply bg-paper text-ink antialiased selection:bg-rust-soft selection:text-rust-deep;
  }
}

/* Tactile scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #EFECE6;
}

::-webkit-scrollbar-thumb {
  background: #CBC7BD;
}

::-webkit-scrollbar-thumb:hover {
  background: #8C887B;
}

/* Light Markdown Typography */
.chat-markdown {
  font-size: 0.9375rem;
  line-height: 1.625;
  color: #18181B;
}

.chat-markdown p {
  margin-bottom: 0.75rem;
}

.chat-markdown p:last-child {
  margin-bottom: 0;
}

.chat-markdown h1,
.chat-markdown h2,
.chat-markdown h3 {
  font-weight: 600;
  color: #18181B;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.chat-markdown code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  padding: 0.15rem 0.375rem;
  background-color: #EFECE6;
  border: 1px solid #E4E2DC;
  color: #9A3412;
}

.chat-markdown pre {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.875rem 1rem;
  background-color: #EFECE6;
  border: 1px solid #CBC7BD;
  overflow-x: auto;
}

.chat-markdown pre code {
  padding: 0;
  border: none;
  background-color: transparent;
  color: #18181B;
}

.chat-markdown blockquote {
  border-left: 3px solid #C2410C;
  padding-left: 0.875rem;
  margin: 0.75rem 0;
  color: #52525B;
  font-style: italic;
  background: #FFF7ED;
}
```

---

## 4. Elimination of "Random Spans" & Semantic HTML Rules

### 4.1 Anti-Pattern Catalog & Refactoring Rules

| Context | ❌ Current Anti-Pattern (Span Soup) | ✅ Semantic Clean Pattern | Rationale |
|---|---|---|---|
| **Buttons & Links** | `<Link><span>Start chatting</span><IconArrowRight /></Link>` | `<Link>Start chatting <IconArrowRight className="..." /></Link>` | Text nodes do not require inline span wrappers. |
| **Separators & Delimiters** | `<span>Claude</span><span className="text-slate-700">·</span><span>GPT</span>` | `<ul className="flex items-center divide-x divide-hairline"><li>Claude</li><li>GPT</li></ul>` or CSS `gap` | Separators belong in CSS styling or semantic list division, not inline text DOM nodes. |
| **Numbered Badges** | `<span className="flex h-8 w-8 ...">01</span>` | `<div className="font-mono text-xs font-bold text-rust">01</div>` or `<ol><li>...</li></ol>` | Numbers in numbered workflows belong in structured `<ol>` / `<li>` semantics. |
| **Hero Eyebrows / Kickers** | `<div className="..."><span>400+ models</span></div>` | `<p className="font-mono text-xs uppercase tracking-widest text-ink-faint">400+ models · zero lock-in</p>` | Eyebrows are descriptive paragraph labels. |
| **Pricing & Badges** | `<span>free</span>` / `<span>$0.003 / req</span>` | `<data value="0" className="font-mono text-xs text-pine">free</data>` / `<data value="0.003">$0.003 / req</data>` | Structured machine-readable data tags. |
| **Syntax Highlighting in Mockups** | `<span className="text-blue-400">const</span> <span className="text-emerald-400">...</span>` | Standard semantic `<code><mark>const</mark> summary = await ai.summarize(...)</code>` or clean code blocks | Keep code clean and accessible without nested span cascades. |

---

## 5. Detailed Section-by-Section Landing Page Architecture

```
+-------------------------------------------------------------------------+
| HEADER (bg-paper, border-b-2 border-ink)                                |
| ChattyDesk [Logo]               Desktop App | Sign In | [Open Chat CTA] |
+-------------------------------------------------------------------------+
| HERO SECTION (bg-paper)                                                 |
|  [01 - CATALOGUE OPENROUTER]                                            |
|  Every model. One chat window.          +-----------------------------+ |
|  Editorial description and value prop   | TACTILE PREVIEW WINDOW      | |
|  [Start Chatting CTA] [Download App]    | (bg-paper-raised, shadow)   | |
|  (v) Free tier included                 +-----------------------------+ |
+-------------------------------------------------------------------------+
| PROVIDERS STRIP (bg-paper-sunken, border-y-2 border-ink)                |
| DIRECT ACCESS: Anthropic · OpenAI · Google · Meta · Mistral · DeepSeek  |
+-------------------------------------------------------------------------+
| FOUR PILLARS (bg-paper)                                                 |
| [Card 1: 400+ Models]  [Card 2: Context Memory]                         |
| [Card 3: BYO API Key]  [Card 4: Cross Platform]                         |
+-------------------------------------------------------------------------+
| THREE STEPS / WORKFLOW (bg-paper-sunken, border-t-2 border-ink)         |
| 01 Create Account  |  02 Pick From Catalogue  |  03 Compare & Chat      |
+-------------------------------------------------------------------------+
| FINAL ACTION PANEL (bg-paper-raised, border-2 border-ink, shadow)       |
| Ready to explore 400+ models? [Start Chatting] [Download Desktop Build] |
+-------------------------------------------------------------------------+
| FOOTER (bg-paper-sunken, border-t-2 border-ink)                         |
| ChattyDesk · OpenRouter Client           Backend Source | SourceForge   |
+-------------------------------------------------------------------------+
```

### 5.1 Header / Navigation
- **Container:** `<header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur-xs">`
- **Logo:** Semantic `<Link to="/" className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink hover:text-rust-deep">`
- **Navigation Links:** Simple `<Link>` and `<a>` elements with `text-xs font-medium text-ink-soft hover:text-ink hover:underline`.
- **Action Button:** High-contrast tactile button:
  ```tsx
  className="inline-flex items-center gap-1.5 bg-ink text-paper text-xs font-semibold px-3.5 py-1.5 transition-colors hover:bg-rust focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
  ```

### 5.2 Hero Section
- **Kicker:** `<p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">400+ models · zero lock-in</p>`
- **Heading:**
  ```tsx
  <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-ink leading-[1.1]">
    Every model.<br />
    <em className="font-normal not-italic text-ink-soft">One chat window.</em>
  </h1>
  ```
- **Prose:** `<p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-ink-soft">`
- **CTAs:**
  - Primary: `<ChatCta label="Start chatting" className="inline-flex items-center justify-center gap-2 bg-ink text-paper hover:bg-rust px-6 py-3 text-sm font-semibold shadow-tactile transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust" />`
  - Secondary: `<Link to="/register" className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-paper-raised hover:bg-paper-sunken text-ink px-6 py-3 text-sm font-medium transition-colors">Create free account</Link>`
  - Tertiary: `<a href="https://chattydesk.sourceforge.io/" className="inline-flex items-center justify-center gap-2 border-2 border-hairline-strong bg-paper hover:bg-paper-sunken text-ink-soft hover:text-ink px-5 py-3 text-sm font-medium transition-colors">Download desktop app</a>`

### 5.3 Tactile Desktop Window Preview (`ChatPreview`)
- Replaces the generic dark MacOS window mockup with a crisp **Paper & Ink Desktop Frame**:
  - Container: `border-2 border-ink bg-paper-raised shadow-tactile overflow-hidden text-xs`
  - Window bar: `border-b-2 border-ink bg-paper-sunken px-4 py-2.5 flex items-center justify-between`
  - Left mini-sidebar: `border-r-2 border-hairline bg-paper-sunken p-3 space-y-3`
  - Chat Area:
    - User message: `bg-ink text-paper p-3 rounded-none border border-ink`
    - Bot message: `bg-paper border-2 border-hairline-strong p-3 text-ink border-l-4 border-l-rust`
    - Code snippet: `bg-paper-sunken border border-hairline p-2.5 font-mono text-[11px] text-ink`
    - Telemetry footer: `font-mono text-[10px] text-ink-faint flex justify-between`

### 5.4 Providers Strip
- **Container:** `<section className="border-y-2 border-ink bg-paper-sunken py-5">`
- **Kicker:** `<h2 className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint mb-3">Direct access via OpenRouter proxies</h2>`
- **Provider List:**
  ```tsx
  <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs sm:text-sm font-medium text-ink-soft">
    <li>Anthropic Claude</li>
    <li aria-hidden="true" className="text-hairline-strong">·</li>
    <li>OpenAI GPT</li>
    <li aria-hidden="true" className="text-hairline-strong">·</li>
    <li>Google Gemini</li>
    <li aria-hidden="true" className="text-hairline-strong">·</li>
    <li>Meta Llama</li>
    <li aria-hidden="true" className="text-hairline-strong">·</li>
    <li>Mistral AI</li>
    <li aria-hidden="true" className="text-hairline-strong">·</li>
    <li>DeepSeek</li>
    <li aria-hidden="true" className="text-hairline-strong">·</li>
    <li>Qwen</li>
  </ul>
  ```

### 5.5 Features Grid (The Four Pillars)
- **Container:** `<section className="py-16 sm:py-20 bg-paper">`
- **Cards (4 Grid Columns):**
  - Card container: `border-2 border-ink bg-paper-raised p-6 shadow-tactile transition-transform hover:-translate-y-0.5`
  - Header: Icon container `h-9 w-9 border-2 border-ink bg-paper-sunken flex items-center justify-center text-rust`
  - Badge: `font-mono text-[10px] uppercase px-2 py-0.5 border border-hairline-strong bg-paper-sunken text-ink-faint`
  - Title: `font-display text-lg font-semibold text-ink mt-4`
  - Prose: `text-xs sm:text-sm leading-relaxed text-ink-soft mt-2`

### 5.6 Three Steps ("How It Works")
- **Container:** `<section className="border-t-2 border-ink bg-paper-sunken py-16 sm:py-20">`
- **Structure:**
  ```tsx
  <ol className="space-y-4">
    <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-tactile-sm">
      <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
        01
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">Create your account</h3>
        <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
          A username and password keeps your conversation threads and model preferences synced across web and desktop.
        </p>
      </div>
    </li>
    {/* Steps 02 and 03 */}
  </ol>
  ```

### 5.7 Final CTA & Footer
- **CTA Box:** Centered card with `border-2 border-ink bg-paper-raised p-8 sm:p-12 shadow-tactile text-center max-w-4xl mx-auto`.
- **Footer:** `border-t-2 border-ink bg-paper-sunken py-8 text-xs text-ink-faint`.

---

## 6. Full Code Implementation Blueprint (`Landing.tsx`)

Here is the exact architectural rewrite of `src/renderer/pages/Landing.tsx` demonstrating zero span pollution and complete light mode fidelity:

```tsx
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { webChatURL } from '../../constant';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconCatalogue,
  IconCheck,
  IconDevices,
  IconExternal,
  IconKey,
  IconLogo,
  IconThread,
} from '../components/icons';

const chatIsHere = !webChatURL;

const primaryButton =
  'inline-flex items-center justify-center gap-2 bg-ink text-paper px-6 py-3 text-sm font-semibold transition-all hover:bg-rust shadow-[4px_4px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const compactButton =
  'inline-flex items-center gap-1.5 bg-ink text-paper px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-rust focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 border-2 border-ink bg-paper-raised px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const quietLink =
  'text-xs font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

function ChatCta({ label, className }: { label: string; className: string }) {
  if (chatIsHere) {
    return (
      <Link to="/chat" className={className}>
        {label}
        <IconArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <a
      href={webChatURL}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
    >
      {label}
      <IconExternal className="h-4 w-4" />
    </a>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  badge?: string;
  title: string;
  children: ReactNode;
}

function FeatureCard({ icon, badge, title, children }: FeatureCardProps) {
  return (
    <article className="border-2 border-ink bg-paper-raised p-6 shadow-[4px_4px_0_0_#C6BEA8] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="inline-flex h-9 w-9 items-center justify-center border-2 border-ink bg-paper-sunken text-rust">
          {icon}
        </div>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-hairline-strong bg-paper-sunken text-ink-faint">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
        {children}
      </p>
    </article>
  );
}

function ChatPreview() {
  return (
    <figure
      aria-hidden="true"
      className="border-2 border-ink bg-paper-raised shadow-[6px_6px_0_0_#C6BEA8] overflow-hidden text-xs select-none"
    >
      {/* Title Bar */}
      <header className="flex items-center justify-between border-b-2 border-ink bg-paper-sunken px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-ink" />
          <div className="h-2.5 w-2.5 rounded-full border border-ink bg-paper-raised" />
          <div className="h-2.5 w-2.5 rounded-full border border-ink bg-paper-sunken" />
        </div>

        <div className="font-mono text-[11px] text-ink font-medium px-2 py-0.5 border border-hairline-strong bg-paper-raised">
          anthropic/claude-3.5-sonnet
        </div>

        <data value="0.003" className="font-mono text-[10px] text-ink-faint">
          $0.003 / req
        </data>
      </header>

      {/* Window Body */}
      <div className="grid grid-cols-[180px_1fr] min-h-[300px] bg-paper">
        {/* Mock Mini Sidebar */}
        <aside className="hidden sm:block border-r border-hairline bg-paper-sunken p-3 space-y-3">
          <div className="space-y-1">
            <h4 className="font-mono text-[10px] uppercase font-semibold text-ink-faint tracking-wider">
              Recent Threads
            </h4>
            <div className="p-1.5 border border-ink bg-paper-raised text-ink text-[11px] truncate font-medium">
              Summarize 40-page report
            </div>
            <div className="p-1.5 text-ink-soft text-[11px] truncate">
              Debounce async queue
            </div>
            <div className="p-1.5 text-ink-soft text-[11px] truncate">
              PostgreSQL partitioning
            </div>
          </div>

          <div className="pt-2 border-t border-hairline space-y-1">
            <h4 className="font-mono text-[10px] uppercase font-semibold text-ink-faint tracking-wider">
              Catalogue
            </h4>
            <div className="text-[11px] text-ink flex items-center justify-between py-0.5">
              <span>Claude 3.5 Sonnet</span>
              <strong className="font-mono text-[9px] text-pine font-normal">active</strong>
            </div>
            <div className="text-[11px] text-ink-soft flex items-center justify-between py-0.5">
              <span>GPT-4o</span>
              <span className="font-mono text-[9px] text-ink-faint">$2.50/M</span>
            </div>
            <div className="text-[11px] text-ink-soft flex items-center justify-between py-0.5">
              <span>DeepSeek V3</span>
              <strong className="font-mono text-[9px] text-pine font-normal">free</strong>
            </div>
          </div>
        </aside>

        {/* Mock Chat View */}
        <div className="p-4 space-y-3 flex flex-col justify-between bg-paper-raised">
          <div className="space-y-3">
            {/* User message */}
            <div className="ml-auto max-w-[85%] bg-ink p-3 text-paper border border-ink text-xs">
              Compare two models for summarising a 40-page PDF report.
            </div>

            {/* Assistant message */}
            <div className="max-w-[95%] border-2 border-hairline-strong bg-paper p-3 text-ink text-xs border-l-4 border-l-rust space-y-2">
              <p className="leading-relaxed">
                Both handle long context well. The 200K window allows ingesting the entire document in one turn:
              </p>

              <pre className="p-2 font-mono text-[11px] bg-paper-sunken border border-hairline text-ink">
                const summary = await ai.summarize(pdf, &#123; model: &apos;claude-3.5-sonnet&apos; &#125;);
              </pre>

              <footer className="flex items-center justify-between pt-1 border-t border-hairline font-mono text-[10px] text-ink-faint">
                <p>anthropic/claude-3.5-sonnet · 1,204 tokens</p>
                <p className="text-pine font-medium">0.42s</p>
              </footer>
            </div>
          </div>

          {/* Mock Input */}
          <div className="border-2 border-ink bg-paper-sunken p-1.5 flex items-center justify-between">
            <p className="text-ink-faint text-xs pl-2">Ask a follow-up question…</p>
            <div className="bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper">
              Send
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function Landing() {
  const { status, user } = useAuth();

  usePageMeta({
    title: 'ChattyDesk — every AI model in one chat window',
    description:
      'Chat with Claude, GPT, Gemini, Mistral and 400+ more models from one window. Switch model mid-conversation, keep the thread, and reopen anything you asked last week.',
    path: '/',
  });
  const signedIn = status === 'signed-in';

  return (
    <div className="min-h-dvh bg-paper text-ink selection:bg-rust-soft selection:text-rust-deep">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink hover:text-rust-deep">
            <IconLogo className="h-6 w-6" />
            <span>ChattyDesk</span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <a
              href="https://chattydesk.sourceforge.io/"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              Desktop App
            </a>
            {chatIsHere && !signedIn && (
              <Link to="/login" className={quietLink}>
                Sign in
              </Link>
            )}
            <ChatCta
              label={signedIn || !chatIsHere ? 'Open the chat' : 'Get started'}
              className={compactButton}
            />
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                01 — 400+ models · zero lock-in
              </p>

              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-ink leading-[1.1]">
                Every model.<br />
                <em className="font-normal not-italic text-ink-soft">One chat window.</em>
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink-soft">
                Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, DeepSeek, and Mistral in a single unified desktop &amp; web interface. Switch models mid-conversation while preserving full context history.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ChatCta
                  label={signedIn ? 'Open the chat' : 'Start chatting'}
                  className={primaryButton}
                />
                {chatIsHere && !signedIn && (
                  <Link to="/register" className={secondaryButton}>
                    Create free account
                  </Link>
                )}
                <a
                  href="https://chattydesk.sourceforge.io/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={secondaryButton}
                >
                  Download desktop app
                </a>
              </div>

              <footer className="mt-6 flex items-center gap-2 text-xs sm:text-sm text-ink-faint">
                <IconCheck className="h-4 w-4 text-pine" />
                <p>
                  {signedIn && user
                    ? `Signed in as ${user.username}.`
                    : 'Free tier models included. Optional BYO OpenRouter key.'}
                </p>
              </footer>
            </div>

            <div className="mt-10 lg:mt-0">
              <ChatPreview />
            </div>
          </div>
        </section>

        {/* PROVIDERS STRIP */}
        <section className="border-y-2 border-ink bg-paper-sunken py-6">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint mb-4">
              Direct access via OpenRouter proxies
            </h2>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs sm:text-sm font-medium text-ink-soft">
              <li>Anthropic Claude</li>
              <li aria-hidden="true" className="text-hairline-strong">·</li>
              <li>OpenAI GPT</li>
              <li aria-hidden="true" className="text-hairline-strong">·</li>
              <li>Google Gemini</li>
              <li aria-hidden="true" className="text-hairline-strong">·</li>
              <li>Meta Llama</li>
              <li aria-hidden="true" className="text-hairline-strong">·</li>
              <li>Mistral AI</li>
              <li aria-hidden="true" className="text-hairline-strong">·</li>
              <li>DeepSeek</li>
              <li aria-hidden="true" className="text-hairline-strong">·</li>
              <li>Qwen</li>
            </ul>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-16 sm:py-24 bg-paper">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <header className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                One window, the whole catalogue
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink-soft">
                Built for engineers, researchers, and writers who need to compare outputs and switch between specialized models without managing ten different subscriptions.
              </p>
            </header>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<IconCatalogue className="h-5 w-5" />}
                badge="400+ Models"
                title="Searchable Catalogue"
              >
                Instant search across providers, filter by free tier or capability, and inspect live per-million token pricing before sending.
              </FeatureCard>

              <FeatureCard
                icon={<IconThread className="h-5 w-5" />}
                badge="Full Context"
                title="Threads that Remember"
              >
                Seamlessly change models on turn five of a conversation. Context stays intact while the server persists full thread history.
              </FeatureCard>

              <FeatureCard
                icon={<IconKey className="h-5 w-5" />}
                badge="Client Encryption"
                title="Your Key or Ours"
              >
                Chat on the included shared pool, or securely store your personal OpenRouter key with client-side encryption and automatic fallback.
              </FeatureCard>

              <FeatureCard
                icon={<IconDevices className="h-5 w-5" />}
                badge="Cross-Platform"
                title="Desktop & Web"
              >
                A single unified codebase packaged for Windows, macOS, Linux, and modern web browsers with synced account sessions.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-t-2 border-ink bg-paper-sunken py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Three steps to full model freedom
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink-soft">
                No complex API tooling, YAML configuration, or fragmented logins. Everything works out of the box.
              </p>
            </div>

            <ol className="mt-8 space-y-4 lg:mt-0">
              <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-[3px_3px_0_0_#C6BEA8]">
                <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Create your account</h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    A simple username and password keeps your conversation threads and model preferences synced.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-[3px_3px_0_0_#C6BEA8]">
                <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Select any model in the catalogue</h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    Filter by provider, toggle free models, or pick frontier reasoning models with exact pricing transparency.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-[3px_3px_0_0_#C6BEA8]">
                <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
                  03
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Chat with formatted Markdown &amp; telemetry</h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    Receive rich code blocks, tables, and token consumption metrics on every single prompt.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 sm:py-20 bg-paper text-center">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="border-2 border-ink bg-paper-raised p-8 sm:p-12 shadow-[6px_6px_0_0_#C6BEA8]">
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Ready to explore 400+ models?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-ink-soft leading-relaxed">
                Launch in your browser immediately, or download the native desktop installer for your platform.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ChatCta
                  label={signedIn ? 'Open the chat' : 'Start chatting'}
                  className={primaryButton}
                />
                <a
                  href="https://chattydesk.sourceforge.io/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={secondaryButton}
                >
                  Download Desktop Installer
                  <IconExternal className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-2 border-ink bg-paper-sunken py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 sm:px-8 sm:flex-row sm:items-center sm:justify-between text-xs text-ink-faint">
          <div className="flex items-center gap-2">
            <IconLogo className="h-4 w-4" />
            <p>ChattyDesk · Unified AI Model Desktop Client</p>
          </div>

          <nav className="flex items-center gap-6">
            {chatIsHere && !signedIn && (
              <Link to="/login" className={quietLink}>
                Sign in
              </Link>
            )}
            <a
              href="https://github.com/thirza258/chattydesk_backend"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              Backend Source
            </a>
            <a
              href="https://chattydesk.sourceforge.io/"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              SourceForge
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
```

---

## 7. Implementation Roadmap & Checklist

### Phase 1: Theme Infrastructure
- [ ] **`tailwind.config.js`:** Add `paper`, `ink`, `rust`, `pine`, `ember`, `hairline` color maps, font families, and `boxShadow` definitions.
- [ ] **`src/renderer/App.css`:** Set `color-scheme: light`, default `body` background to `bg-paper text-ink`, and adapt `.chat-markdown` for high-contrast light typography.

### Phase 2: Landing Page Rewrite
- [ ] **`src/renderer/pages/Landing.tsx`:** Replace span wrappers with semantic HTML (`article`, `figure`, `header`, `ol`, `li`, `data`, `em`).
- [ ] Update all hero and preview elements to use tactile Paper & Ink styling.
- [ ] Remove all blue radial glow blurs (`blur-[120px]`) and neon buttons.

### Phase 3: Auth & Settings Consistency (Optional / Follow-up)
- [ ] **`src/renderer/components/AuthShell.tsx`:** Update container to light mode (`bg-paper`, card `bg-paper-raised border-2 border-ink shadow-tactile`).
- [ ] **`src/renderer/pages/Settings.tsx`:** Adapt settings cards to Paper & Ink theme.

### Phase 4: Verification & Testing
- [ ] Run `npx tsc --noEmit` to verify type integrity.
- [ ] Run `npm run lint` to enforce formatting and React accessibility rules.
- [ ] Run unit tests: `npm test`.
