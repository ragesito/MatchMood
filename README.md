# MatchMood

> Real-time 1v1 competitive coding platform — solve algorithm challenges, earn ELO, climb the leaderboard.

## Overview

MatchMood pairs two developers in a live coding duel. Both players receive the same challenge and submit solutions that are evaluated against hidden test cases via Judge0. Rounds are best-of-three; ELO rating adjusts after every match.

**Live demo:** _coming soon_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (standalone components, signals) |
| Backend | Node.js · Express 5 · TypeScript |
| Database | PostgreSQL 16 · Prisma ORM |
| Real-time | Socket.io 4 |
| Code editor | Monaco Editor (VS Code engine) |
| Code execution | Judge0 API (sandboxed, 7 languages) |
| AI challenges | OpenAI GPT-4o-mini |
| Payments | Stripe (Checkout + Webhooks) |
| Auth | JWT · GitHub OAuth · Email/Password |
| Deploy | Railway (backend + DB) · Vercel (frontend) |

---

## Features

- **Real-time matchmaking** — join the queue, get paired instantly via WebSockets
- **Match Found screen** — opponent info, countdown, and audio cue before the battle starts
- **7 languages** — JavaScript, TypeScript, Python, Go, Rust, Java, C++
- **Monaco Editor** — full syntax highlighting per language, no false errors
- **AI-generated challenges** — dynamic problems via GPT-4o-mini with curated fallback pool
- **Judge0 execution** — sandboxed code runs with per-language runner injection
- **ELO rating system** — win/loss adjusts your rating; ranked leaderboard (global & weekly)
- **Reconnection window** — 30-second grace period if a player disconnects mid-match
- **Three-tier subscription** — Free / Premium / Enterprise via Stripe
- **Private rooms** — Enterprise users can host invite-only matches for recruiting
- **Public profiles** — shareable `/u/:username` pages with stats and match history
- **First-visit intro screen** — animated onboarding experience on first login

---

## Project Structure

```
matchmood/
├── backend/          # Node.js + Express API + Socket.io server
│   ├── prisma/       # Schema + migrations
│   └── src/
│       ├── config/   # OpenAI, Passport, Prisma, Stripe clients
│       ├── middleware/
│       ├── routes/   # REST endpoints
│       ├── services/ # Challenge generation logic
│       └── socket/   # Real-time match logic
│
└── frontend/         # Angular 17 SPA
    └── src/app/
        ├── core/     # Guards, interceptors, services
        ├── features/ # Pages (arena, dashboard, leaderboard, etc.)
        └── shared/   # Monaco editor, modals, shell layout
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)
- Judge0 API key (RapidAPI)
- OpenAI API key
- GitHub OAuth app
- Stripe account

### Backend

```bash
cd backend
cp .env.example .env   # fill in your keys
docker compose up -d   # starts PostgreSQL
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start              # http://localhost:4200
```

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list of required variables.

---

## Roadmap

- [ ] Deploy to Railway + Vercel
- [ ] Spectator mode
- [ ] Post-match recruiter reports
- [ ] Email/push notifications
- [ ] Achievement system
- [ ] Curated challenge seed data

---

## License

MIT
