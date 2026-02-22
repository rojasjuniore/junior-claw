# 🦞 Junior Claw

**Mission Control — El cockpit del CEO y su squad de agentes AI**

Dashboard en tiempo real para monitorear y controlar tu squad de OpenClaw.

## Features

- 🏢 **Office View** — Visual representation of all 12 agents with live status
- 📊 **Dashboard** — Real-time metrics, costs, sessions, and system info
- 📥 **Decision Inbox** — Approve/reject agent proposals (persistent)
- ⏰ **Cron Manager** — View and trigger cron jobs from OpenClaw
- 🧠 **Memory Browser** — Navigate and edit agent memory files
- 👥 **Agent Profiles** — Stats per agent
- 💰 **Cost Center** — Track and analyze AI spending
- ⚙️ **Settings** — System info and configuration

## Quick Start

```bash
cd ~/.openclaw/workspace/projects/clawhq
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Charts:** Recharts
- **Data:** Reads directly from `~/.openclaw/`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/status` | Gateway status, sessions, costs, system metrics |
| `/api/sessions` | List all OpenClaw sessions |
| `/api/crons` | List and trigger cron jobs |
| `/api/decisions` | CRUD for decision inbox |
| `/api/memory` | Browse workspace files |

## Data Sources

| Data | Source |
|------|--------|
| Sessions | `~/.openclaw/agents/main/sessions/sessions.json` |
| Config | `~/.openclaw/openclaw.json` |
| Crons | `openclaw cron list` CLI |
| Memory | `~/.openclaw/workspace/` |
| Decisions | `~/.openclaw/workspace/clawhq/data/decisions.json` |

## The Squad

| Agent | Role | Emoji |
|-------|------|-------|
| Junior Claw | CEO & Copilot | 🦞 |
| Pixel | Frontend Specialist | 🎨 |
| Stack | Backend Engineer | 🔌 |
| Shield | QA & Security | 🛡️ |
| Pipeline | DevOps & Deploy | 🚀 |
| Sentinel | Monitoring & Ops | 👁️ |
| Atlas | Project Manager | 📋 |
| Hunter | BizDev & Sales | 🎯 |
| Scope | Proposals & Scoping | 🔭 |
| Vox | Marketing & Content | 📢 |
| Ledger | Finance & Billing | 💰 |
| Echo | Customer Support | 🤝 |

## Deploy to Railway

```bash
# Build
pnpm build

# Deploy
railway up
```

Or connect the GitHub repo for auto-deploys.

## License

MIT — Built for Junior & Junior Claw 🦞
