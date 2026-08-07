<p align="center">
  <a href="https://blu3.in"><img src="public/logo/tvlogo.png" alt="Logo" height=140></a>
</p>
<h1 align="center">Blu3 — music rooms</h1>

<p align="center">
<a href="https://x.com/bluwixyz" target="_blank"><img height=20 src="https://img.shields.io/badge/x-@bluwixyz-000000" /></a>
<img src="https://img.shields.io/github/stars/xrealblue/blu3" alt="stars">
<a href="https://blu3.in"><img src="https://img.shields.io/static/v1?label=status&message=live-demo&color=success" alt="status" /></a>
</p>

<div align="center">
  <a href="https://blu3.in">Website</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://github.com/xrealblue/blu3">GitHub</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://x.com/bluwixyz">Twitter</a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://github.com/xrealblue/blu3/issues/new">Issues</a>
  <br />
</div>

### [Try it live →](https://blu3.in)

## What is Blu3?

Blu3 is a real-time collaborative music listening platform. Create rooms, queue songs, and listen together with synchronized playback. It's built as a **non-commercial, student-built educational project**.

This repository contains the **open-source frontend client** — a Next.js application that powers the entire user interface. The backend server lives in a separate repo at [`blu3-server`](https://github.com/xrealblue/blu3-server) — both are open source together. See [`blu3-server/README.md`](https://github.com/xrealblue/blu3-server/blob/main/README.md) for the full REST + WebSocket protocol reference.

```bash
bun install          # install deps
bun run dev          # start the development server (http://localhost:3000)
bun run build        # build for production
bun run start        # start the production server
npx tsc --noEmit     # typecheck only
```

## Features

- **Real-time sync** — Listen together with perfectly synchronized playback
- **Music rooms** — Create or join rooms with a shareable invite code
- **Multi-source search** — Search and play from YouTube & JioSaavn
- **In-app chat** — Real-time messaging with GIF support
- **Collaborative queue** — Add, remove, reorder tracks together
- **Playlists** — Create, save, and share your favorite collections
- **No ads, no tracking** — Completely free, no cookies, no analytics

## Tech Stack

| | |
|---|---|
| **Framework** | Next.js 16.2.6 (App Router) |
| **Language** | TypeScript |
| **UI runtime** | React 19.2.4 |
| **Styling** | Tailwind CSS v4 |
| **Player** | YouTube IFrame API + Tone.js (waveform / DSP) |
| **Auth** | better-auth client (`src/lib/auth-client.ts`) — Google + Discord OAuth |
| **Icons** | Phosphor (`@phosphor-icons/react`), Lucide |
| **UI primitives** | Radix UI (slider), OverlayScrollbars |
| **Media extras** | Lottie, qrcode, pako (decompression) |
| **SEO** | next-sitemap (`next-sitemap.config.js`) |
| **Runtime** | Bun (recommended by `AGENTS.md`) — `npm`/`node` also work since scripts invoke `next`/`node` directly |

## Install

> **Prerequisites:** [Bun](https://bun.sh) (recommended) or Node.js >= 20, and a running instance of [`blu3-server`](https://github.com/xrealblue/blu3-server) (see its [`README.md`](https://github.com/xrealblue/blu3-server/blob/main/README.md)).

```sh
git clone https://github.com/xrealblue/blu3.git
cd blu3/blu3-client
bun install
```

`postinstall` automatically runs `scripts/generate-sw.mjs`, which writes a versioned service worker to `public/sw.js`. This also runs before `dev` and `build`, so you don't need to invoke it manually.

### Configure

Create a `.env.local` file. Only one variable is required:

```
NEXT_PUBLIC_API_URL    URL of the blu3-server instance (default: http://localhost:8000)
```

The WebSocket URL is **derived** from `NEXT_PUBLIC_API_URL` — `useRoomSocket.ts` does `API_URL.replace("http", "ws")`, so `http://localhost:8000` becomes `ws://localhost:8000`. You do not need a separate `NEXT_PUBLIC_WS_URL`.

> Make sure the server's `FRONTEND_URL` / `CORS_ORIGINS` include your client origin (e.g. `http://localhost:3000`), otherwise auth cookies and CORS will silently fail. The server defaults already include it.

### Run

```sh
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```sh
bun run build
bun run start
```

## Talking to the backend

The client never talks to YouTube/JioSaavn directly — every request goes through `blu3-server`:

- **REST** — base URL is `NEXT_PUBLIC_API_URL` (defaulted everywhere it's used, e.g. `src/hooks/useRoom.ts`, `src/hooks/usePlaylists.tsx`, `src/app/(secure)/room/[code]/page.tsx`). All browser fetches use `credentials: "include"` for the better-auth session cookie.
- **WebSocket** — `src/hooks/useRoomSocket.ts` connects to `ws://<API_URL>/ws?token=<sessionToken>&room=<CODE>`. See the [WS Protocol section](https://github.com/xrealblue/blu3-server/blob/main/README.md#websocket-protocol) of the server README for the full client→server / server→client message reference.
- **Auth** — `src/lib/auth-client.ts` is the better-auth client. Sign-in buttons live in `src/components/LoginPopup.tsx`; the desktop OAuth handoff uses `GET /api/auth/desktop-redirect` on the server (still referenced by `LoginPopup.tsx` and `src/app/login/page.tsx` for the `blu3://` protocol, though the Electron shell itself is no longer in this repo).
- **Audio** — the `<audio>` element's `src` points at `GET /api/audio/:videoId?token=<sessionToken>` on the server, which proxies the underlying CDN stream with `Range` support.

The client also has two of its own Next.js route handlers under `src/app/api/` that proxy/server-render for the backend: `api/search` (passes search queries through to the server) and `api/og` (renders OpenGraph metadata for room share links).

## Project Structure

```
blu3-client/
├── .github/
├── public/
│   └── logo/                 # Brand assets
├── scripts/
│   └── generate-sw.mjs       # Writes public/sw.js (runs on dev/build/postinstall)
├── src/
│   ├── app/
│   │   ├── (secure)/          # Authenticated routes (browse, room/[code])
│   │   ├── api/               # Client route handlers (search proxy, OG render)
│   │   ├── auth/callback/     # OAuth callback page
│   │   ├── login/             # Login landing
│   │   ├── privacy/ terms/    # Legal pages
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Landing
│   │   └── sitemap.ts         # Dynamic sitemap from server's /api/rooms/sitemap
│   ├── components/
│   │   ├── Player/
│   │   │   ├── ui/            # Room UI (chat, queue, members, search, popups, visualizers)
│   │   │   ├── YouTubePlayer.tsx
│   │   │   └── constants.ts
│   │   ├── ui/                # Shared UI atoms
│   │   ├── LoginPopup.tsx
│   │   ├── Profile.tsx
│   │   ├── QRCode.tsx
│   │   ├── RoomMetadata.tsx
│   │   └── ServiceWorkerRegistrar.tsx
│   ├── hooks/                 # React hooks (auth, room, player, socket, search, playlists)
│   ├── lib/
│   │   ├── auth-client.ts     # better-auth client
│   │   └── fetchCache.ts
│   ├── assets/                # Lottie / images
│   └── utils/
│       └── types.ts           # Shared types (Track, RecentTrack, PlayerState, …)
├── AGENTS.md                  # Agent rules: USE bun.js, build/typecheck commands
├── METADATA.json
├── TERMS.md
├── next-sitemap.config.js
├── LICENSE
└── README.md
```

## Contributing

This is a student-built educational project. Contributions, issues, and feature requests are welcome — open an issue or submit a pull request.

Where things live:
- **Hooks** — `src/hooks/` (`useAuth`, `useRoom`, `useRoomSocket`, `usePlayerEngine`, `usePlayerState`, `useSearch`, `usePlaylists`, `useSuggestions`, `useIcon`)
- **Components** — `src/components/` for shared atoms; `src/components/Player/ui/` for the in-room experience (queue, chat, members, search overlay, popups, waveform visualizers)
- **Pages / routes** — `src/app/` (App Router); `src/app/(secure)/` is the authenticated route group, `src/app/api/` holds client-side route handlers that proxy to the server
- **Shared types** — `src/utils/types.ts` (`Track`, `RecentTrack`, `PlayerState`, `SearchResponse`)
- **Auth client** — `src/lib/auth-client.ts`

Build & typecheck (from `AGENTS.md`):
```sh
cd blu3-client && bun run build
cd blu3-client && npx tsc --noEmit
```

When adding a feature that talks to the server, check [`blu3-server/README.md`](https://github.com/xrealblue/blu3-server/blob/main/README.md) first — the REST endpoints, WS message unions, and auth flow are all documented there.

## License

Custom Non-Commercial Educational License — see [LICENSE](./LICENSE) for details.
