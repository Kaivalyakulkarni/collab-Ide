# Collab IDE

> A modern browser-based collaborative IDE built with Next.js, Monaco Editor, Yjs, Docker, Prisma and Supabase.

## Overview

Collab IDE recreates the experience of a desktop IDE inside the browser. Developers can collaborate in real time, edit files simultaneously using CRDTs, execute code inside isolated Docker containers, receive AI-powered inline code completions, and manage Git workflows without leaving the application.

## Highlights

- Real-time collaboration using Yjs + WebSockets
- Monaco Editor with multi-file workspace
- Docker-backed terminal using node-pty and xterm.js
- AI inline completions powered by Groq
- Git integration using isomorphic-git
- GitHub OAuth authentication with NextAuth v5
- PostgreSQL database via Supabase and Prisma ORM
- Animated landing page built with React Three Fiber and GSAP
- Responsive dashboard and project management UI

## Screenshots

Create a `screenshots/` folder and place:

- dashboard.png
- project-dashboard.png
- editor.png

```md
![Dashboard](screenshots/dashboard.png)

![Project Dashboard](screenshots/project-dashboard.png)

![Editor](screenshots/editor.png)
```

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Collaboration | Yjs, y-monaco, WebSocket |
| Editor | Monaco Editor |
| Execution | Docker, node-pty, xterm.js |
| Database | PostgreSQL, Prisma, Supabase |
| Authentication | NextAuth v5, GitHub OAuth |
| AI | Groq llama-3.3-70b-versatile |
| Deployment | Vercel, Render |

## Repository Structure

Top-level folders detected:

- collab-ide-for-zip

## Local Setup

```bash
git clone https://github.com/Kaivalyakulkarni/collab-Ide.git
cd collab-Ide
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Environment variables:

```env
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
DATABASE_URL=
GROQ_API_KEY=
WEBSOCKET_URL=
```

Docker must be running locally for sandbox execution.

## Architecture

Browser
  |
Next.js App Router
  |
API Routes
  |
Prisma ORM
  |
Supabase PostgreSQL

Realtime collaboration:
Monaco <-> Yjs <-> WebSocket Server

Execution:
Editor -> API -> Docker Container -> xterm.js

## Design Decisions

- Monaco provides a VS Code-like editing experience.
- Yjs CRDTs eliminate merge conflicts during simultaneous editing.
- Docker isolates arbitrary code execution from the application server.
- PostgreSQL models projects, files, users and collaborators naturally.
- React Three Fiber is conditionally mounted only on desktop for better mobile performance.

## License

MIT
