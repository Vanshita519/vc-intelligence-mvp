# Scout AI — VC Intelligence Platform

A modern VC discovery interface with AI-powered live enrichment. Built as an MVP for the VC Intelligence Intern take-home assignment.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwind-css)

## Features

### Core Interface
- **App Shell** — Sidebar navigation with global search (⌘K / Ctrl+K)
- **Companies Page** (`/companies`) — Search, filter (sector/stage/location), sortable table, pagination
- **Company Profile** (`/companies/[id]`) — Overview, signals timeline, notes (localStorage), save-to-list
- **Lists** (`/lists`) — Create lists, add/remove companies, export CSV/JSON
- **Saved Searches** (`/saved`) — Save & re-run filter combinations

### Live Enrichment (Key Feature)
On any company profile, click **"Enrich"** to:
1. Fetch the company's public website HTML (server-side)
2. Extract visible text content
3. Send to **Google Gemini 1.5 Flash** for structured analysis
4. Display: Summary, What They Do (bullets), Keywords, Derived Signals, Sources + Timestamp
5. Cache results in both server memory and client localStorage

## Architecture

```
src/
├── app/
│   ├── api/enrich/route.ts    # Server-side enrichment endpoint
│   ├── companies/
│   │   ├── page.tsx           # Companies listing with search/filter/sort
│   │   └── [id]/page.tsx      # Company profile with enrichment
│   ├── lists/page.tsx         # Lists management
│   ├── saved/page.tsx         # Saved searches
│   ├── layout.tsx             # Root layout with sidebar
│   ├── globals.css            # Design system
│   └── page.tsx               # Root redirect
├── components/
│   ├── Sidebar.tsx            # Fixed sidebar navigation
│   └── GlobalSearch.tsx       # ⌘K search modal
├── data/
│   └── companies.json         # Mock dataset (20 companies)
├── hooks/
│   └── useLocalStorage.ts     # localStorage persistence hook
└── lib/
    ├── companies.ts           # Data loading & filtering utilities
    └── types.ts               # Shared TypeScript interfaces
```

## Enrichment Logic

The `/api/enrich` endpoint (POST):

1. **Input**: `{ url: string, companyName: string }`
2. **Cache check**: Server-side in-memory `Map` keyed by URL
3. **Fetch**: Downloads the HTML from the company's public website (10s timeout)
4. **Extract**: Strips scripts/styles/nav/footer, decodes HTML entities, limits to 8K chars
5. **Page signals**: Checks HTML for careers, blog, about, pricing page indicators
6. **AI Analysis**: Sends extracted text to Gemini 1.5 Flash with a structured prompt
7. **Parse**: Cleans markdown fences from response, parses JSON
8. **Output**: Returns `{ summary, whatTheyDo[], keywords[], derivedSignals[], sources[], timestamp }`

### Caching Strategy
- **Server**: In-memory `Map` prevents duplicate Gemini calls within same server session
- **Client**: localStorage caches enrichment results — if data exists, API is never called again
- This is critical for Gemini free tier (15 req/min rate limit)

### Error Handling
- Website fetch timeout (504)
- Website unreachable (502)
- Gemini rate limit (429) — friendly message
- Missing API key (500) — configuration error
- JSON parse failure — retry suggestion

## Setup

### Prerequisites
- Node.js 18+
- Gemini API key ([Get one free](https://aistudio.google.com/app/apikey))

### Install & Run

```bash
# Clone and install
git clone <your-repo-url>
cd vc
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for enrichment |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Google Gemini 1.5 Flash via `@google/generative-ai`
- **Icons**: Lucide React
- **Data**: Mock JSON dataset (20 companies)
- **Persistence**: localStorage for notes, lists, saved searches, enrichment cache

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

Set `GEMINI_API_KEY` in your Vercel project's Environment Variables.
