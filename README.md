# collab_ide

> A full-stack, browser-based collaborative IDE — real-time multiplayer editing, sandboxed Docker execution, AI completions, and git, all in one tab. Built with Next.js, Monaco Editor, Yjs, and PostgreSQL.

## 🔗 Live Demo
[collab-ide-nine.vercel.app](https://collab-ide-nine.vercel.app)

## ✨ Features

**Editor & Collaboration**
- Real-time multiplayer editing powered by **Yjs CRDTs** — colored cursors, live presence, no merge conflicts
- VS Code–grade Monaco Editor in the browser, with tabs, breadcrumbs, and a status bar
- File tree with inline create/rename/delete and auto-expansion

**Execution**
- Sandboxed terminal via **Docker + node-pty + xterm.js** — code runs in an isolated container per project, with automatic file re-sync after execution
- No local installs required — everything runs server-side in the sandbox

**AI**
- Inline AI code completions via **Groq** (`llama-3.3-70b-versatile`), wired into Monaco's `InlineCompletionsProvider`
- Adjustable completion strength, toggled from the editor status bar

**Git**
- Git panel built on **isomorphic-git** — init, status, and commit, all from the browser, no terminal `git` required

**Collaboration & Auth**
- GitHub OAuth via **NextAuth v5**, running on a custom raw-SQL implementation (see [Architecture Decisions](#-architecture-decisions) — the standard Prisma adapter doesn't work here)
- Token-based project invites, inline role management, and collaborator removal

**Dashboard & Landing**
- Project dashboard — navbar, sidebar, stats, activity feed
- Fully animated landing page (React Three Fiber + GSAP ScrollTrigger), with a true mobile-responsive fallback: the 3D scene is never mounted below 768px, replaced with a static card stack

## 🚧 Coming Soon
- Dashboard wired to real project data (currently hardcoded — next priority)
- WebRTC video/voice chat for in-editor pairing
- Per-project settings panel (delete, archive, status changes)

## 🛠 Tech Stack
- **Frontend** — Next.js (App Router), TypeScript, Tailwind CSS
- **Editor** — Monaco Editor + `y-monaco` (CRDT binding)
- **Real-time** — Yjs, WebSocket server (Render.com)
- **Execution** — Docker, node-pty, xterm.js
- **Git** — isomorphic-git
- **AI** — Groq API (`llama-3.3-70b-versatile`)
- **Auth** — NextAuth.js v5 (GitHub OAuth, custom raw-SQL adapter)
- **Database** — PostgreSQL via **Supabase** + Prisma ORM
- **Landing page** — React Three Fiber, GSAP ScrollTrigger, ShaderGradient
- **Deployment** — Vercel (frontend) + Render.com (WebSocket server)

## 🚀 Running Locally

1. Clone the repo
```bash
git clone https://github.com/Kaivalyakulkarni/collab-Ide.git
cd collab-Ide
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables — create `.env.local`:
```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
DATABASE_URL=          # Supabase transaction pooler URL (port 6543) — required for Vercel serverless
GROQ_API_KEY=
WEBSOCKET_URL=
```

4. Push database schema
```bash
npx prisma db push
```

5. Seed the database
```bash
npx prisma db seed
```

6. Run the dev server
```bash
npm run dev
```

> **Note:** Docker must be running locally for the sandboxed terminal to execute code. On Windows, `node-pty` requires the full executable path configured explicitly — see `docker` setup notes in `/lib`.

## 📁 Project Structure
```
app/
├── (auth)/          # Login & register pages
├── api/             # Backend API routes
├── dashboard/       # User dashboard
└── editor/          # Main IDE page — Monaco, file tree, terminal, git panel
components/
├── Editor.tsx       # Monaco editor wrapper (Yjs + y-monaco bound)
├── FileTree.tsx      # File tree sidebar
├── Terminal.tsx       # xterm.js terminal, Docker-backed
└── GitPanel.tsx        # Git init/status/commit UI
lib/
├── db.ts              # Prisma client
├── docker.ts           # Sandbox container orchestration
└── auth.ts             # NextAuth v5 raw-SQL adapter
prisma/
└── schema.prisma        # Database schema
```

## 🧠 Architecture Decisions
- **Next.js App Router** over Pages Router — React Server Components for faster loads
- **PostgreSQL (Supabase)** over MongoDB — relational structure suits projects/files/members; Supabase over Railway for built-in pooling and easier Vercel serverless compatibility
- **Monaco Editor** over CodeMirror — same engine as VS Code, familiar to developers, and has first-class Yjs binding support via `y-monaco`
- **Yjs CRDTs** for real-time sync — conflict-free by construction, avoids building custom operational-transform logic for multiplayer editing
- **NextAuth v5 with a custom raw-SQL adapter, not `@auth/prisma-adapter`** — Prisma 7's `PrismaPg` driver adapter breaks the standard NextAuth Prisma adapter (model properties return `undefined`). Auth is implemented directly against Postgres via `$executeRaw` tagged templates instead.
- **Docker sandboxing** for code execution — keeps arbitrary user code fully isolated from the app server; files are written to `/tmp/workspace` per session and executed in a disposable container
- **True conditional mounting for mobile** on the landing page — the React Three Fiber scene is never mounted below the 768px breakpoint (not just hidden via CSS), avoiding an unnecessary WebGL context and render loop on mobile devices