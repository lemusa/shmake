# SHMAKE Portfolio — Vite + React + Tailwind

Converted from static HTML to a component-based React app, ready for admin system integration.

## Stack

- **Vite** — build tool
- **React 19** — UI framework
- **Tailwind CSS v4** — utility-first styling (via `@tailwindcss/vite` plugin)

## Quick Start

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to /dist
npm run preview  # preview production build
```

## Project Structure

```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # Root layout
├── index.css                 # Tailwind import + custom styles
├── context/
│   ├── ThemeContext.jsx       # Dark/light mode state
│   └── PortfolioContext.jsx   # Portfolio overlay, filtering, modal state
├── data/
│   └── projects.js           # Data layer — admin integration point
├── components/
│   ├── Header.jsx            # Fixed header (menu + theme toggle)
│   ├── NavSidebar.jsx        # Slide-out navigation
│   ├── HeroCards.jsx         # Expanding hero card panels
│   ├── About.jsx             # Bio, photo, skills grid
│   ├── Contact.jsx           # Contact form + reCAPTCHA
│   ├── SocialLinks.jsx       # LinkedIn, WhatsApp icons
│   ├── Footer.jsx            # Copyright
│   ├── PortfolioOverlay.jsx  # Full-screen portfolio browser
│   ├── ProjectCard.jsx       # Individual project card
│   ├── SkillsCard.jsx        # Featured skills card
│   ├── ProjectDetailModal.jsx # Project detail popup
│   └── ImageIcon.jsx         # Placeholder SVG icon

public/
└── projects.json             # Portfolio data (fetched at runtime)
```

## Admin Integration

All configurable content lives in `src/data/projects.js`. When the admin system is ready, replace the static exports/fetches with API calls:

| Content             | Current source           | Future admin endpoint          |
|---------------------|--------------------------|--------------------------------|
| Projects + categories | `public/projects.json` | `GET /api/portfolio/projects`  |
| Hero cards          | `HERO_CARDS` constant    | `GET /api/portfolio/hero-cards`|
| About section       | `ABOUT_CONTENT` constant | `GET /api/portfolio/about`     |
| Contact config      | `CONTACT_CONFIG` constant| `GET /api/portfolio/contact`   |
| Site metadata       | `SITE_META` constant     | `GET /api/portfolio/meta`      |

Data shapes are documented inline — the admin backend returns the same structure, no component changes needed.

## Deployment

Copy your existing `assets/` folder into `public/` before building:

```bash
cp -r /path/to/current-site/assets public/
npm run build
# Deploy /dist
```
