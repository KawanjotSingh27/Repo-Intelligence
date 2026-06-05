# RepoIntel

Analyzes TypeScript repositories to surface the blast radius and risk of a pull request before it gets merged.

## What it does

When you change a file in a large codebase, it's hard to know what else might break. RepoIntel parses the dependency graph of your project, scores each file by how risky it is to change, and tells you exactly what's affected and how deeply.

You can use it three ways:
- **Web dashboard** — paste a GitHub PR URL and get a visual dependency graph with risk scores
- **GitHub App** — auto-comments a risk report on every PR when it's opened
- **CLI** — run it locally against any TypeScript project

## How the scoring works

Each file gets a risk score based on:
- How many files depend on it, weighted by depth (direct dependents count 3x more than indirect)
- How many exports it has — more exports means more surface area for breaking changes
- Whether it's in a circular dependency — doubles the score

Critical files are identified by comparing scores against 2x the average score of impacted files, not the whole repo, so the threshold stays meaningful regardless of repo size.

## CLI

```bash
# analyze a local project
repointel analyze ./myproject --files src/utils.ts

# exit with code 1 if score exceeds threshold (useful for CI)
repointel analyze ./myproject --files src/utils.ts --threshold 10

# output as JSON
repointel analyze ./myproject --files src/utils.ts --format json
```

## Stack

- **Engine** — TypeScript, static import analysis, BFS impact traversal, DFS cycle detection
- **Backend** — Node.js, Express, PostgreSQL (Neon)
- **Frontend** — React, ReactFlow, Recharts, Dagre
- **Auth** — GitHub OAuth, JWT
- **Deployment** — Vercel (frontend), Render (backend)

## Local setup

```bash
# clone and install
git clone https://github.com/KawanjotSingh27/Repo-Intelligence
npm install
cd client && npm install

# run backend
npm run dev

# run frontend
cd client && npm run dev
```

## Live

[repo-intelligence-gamma.vercel.app](https://repo-intelligence-gamma.vercel.app)