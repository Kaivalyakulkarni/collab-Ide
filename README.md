# Collab IDE

> A browser-based collaborative code editor — built with Next.js, Monaco Editor, and PostgreSQL.

## 🔗 Live Demo
[collab-ide-nine.vercel.app](https://collab-ide-nine.vercel.app)

## ✨ Features (Phase 1)
- GitHub OAuth authentication
- VS Code-grade Monaco Editor in the browser
- File tree navigation
- File content loads on click
- PostgreSQL database for file persistence

## 🚧 Coming Soon
- Real-time collaborative editing (Yjs CRDTs)
- Shared terminal via Docker + node-pty
- AI code suggestions
- Git integration
- Video/voice chat via WebRTC

## 🛠 Tech Stack
- **Frontend** — Next.js 16, TypeScript, Tailwind CSS
- **Editor** — Monaco Editor
- **Auth** — NextAuth.js v5 (GitHub OAuth)
- **Database** — PostgreSQL (Railway) + Prisma ORM
- **Deployment** — Vercel

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
   DATABASE_URL=
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

## 📁 Project Structure
```
app/
├── (auth)/          # Login & register pages
├── api/             # Backend API routes
├── dashboard/       # User dashboard
└── editor/          # Main IDE page
components/
├── Editor.tsx       # Monaco editor wrapper
└── FileTree.tsx     # File tree sidebar
lib/
└── db.ts            # Prisma client
prisma/
└── schema.prisma    # Database schema
```

## 🧠 Architecture Decisions
- **Next.js App Router** over Pages Router — React Server Components for faster loads
- **PostgreSQL** over MongoDB — relational structure suits projects/files/members
- **Monaco Editor** over CodeMirror — same engine as VS Code, familiar to developers
- **NextAuth v5** — built for App Router, handles GitHub OAuth cleanly