# Project Overview

## Name
**BloggingAgent** (UI branded as "AI Content Pro")

## Purpose
An AI-powered content discovery and generation platform for bloggers. It automatically discovers trending topics from Google Trends and Reddit, scores them for blog potential, and provides AI-powered content suggestions via DeepSeek AI.

## Primary Use Case
A blogger logs in → views trending topics discovered from multiple sources → receives AI-generated blog angles, titles, keywords, and outlines → can queue content for publishing.

## Architecture Type
Full-stack monorepo with:
- **Frontend:** React + TypeScript SPA (`/content-catalyst/`)
- **Backend:** Node.js + Express REST API (`/server/`)

## What's Fully Working
- User authentication (signup/login with email+password)
- Google Trends discovery via SerpAPI
- Reddit feed aggregation (no API key needed, public API)
- Content scoring algorithms (velocity, debate ratio, composite)
- Supabase caching with 6-hour TTL
- Daily midnight cron job to refresh cache
- DeepSeek AI trend analysis and blog brief generation
- TrendsPage (only frontend page connected to live API)
- Multi-region support: US, GB, PK, IN, CA
- Category filtering: all, tech, news

## What's UI-Only / Incomplete
- Dashboard — hardcoded mockup data
- Content Queue — local state, no persistence
- Publishing Calendar — UI only, no backend scheduling
- Article Editor — no save/fetch backend
- Analytics — placeholder charts, no real data
- Integrations — no actual WordPress/Medium sync
- Google OAuth — commented out

## Multi-Region Support
Regions: `US`, `GB`, `PK`, `IN`, `CA`
Categories: `all`, `tech`, `news`

## External Services
| Service | Purpose |
|---------|---------|
| SerpAPI | Google Trends data |
| Reddit API | Trending posts (no auth required) |
| DeepSeek | AI content analysis & generation |
| Supabase | PostgreSQL database & cache store |
