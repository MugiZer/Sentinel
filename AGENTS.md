## Cursor Cloud specific instructions

### Product overview

Sentinel is a policy verification firewall for Botpress AI agents. It compiles enterprise policy documents into a deterministic knowledge graph and evaluates proposed agent responses against those checks at runtime. No LLM calls or external databases are needed — all checks are keyword-based fact extraction and the audit store is in-memory.

### Repository layout

- **Root (`/workspace`)** — Main Sentinel app (Next.js 16, React 19, port 3002). This is the primary project.
- **`/workspace/sentinel-app`** — Older scaffolded Next.js 14 app. Largely boilerplate; not needed for the main product.
- **`/workspace/sentinel-context`** — Design/spec markdown documents (reference only).

### Running the app

```
npm run dev        # starts Next.js dev server on port 3002
```

nvm is installed at `/home/ubuntu/.nvm/nvm.sh` (Node v22 LTS). The shell must source it before running `node`/`npm`. This is already configured in `~/.bashrc`.

### Testing

```
npm test           # runs vitest (24 unit tests in src/lib/sentinel/)
```

### Lint / type-check

The root app has no ESLint config — use TypeScript type-checking instead:

```
npx tsc --noEmit   # type-check the root app
```

The `sentinel-app` sub-project has ESLint:

```
cd sentinel-app && npm run lint
```

### Key API endpoints (all on port 3002)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/verify` | POST | Verify a proposed bot response against active policy checks |
| `/api/policy/compile` | POST | Compile policy document into sections, graph, and checks |
| `/api/audit` | GET | List all audit events (in-memory, resets on restart) |

### Gotchas

- Both the root app and `sentinel-app` default to port 3002. Only run one at a time.
- The audit store is in-memory; restarting the dev server clears all audit events.
- `passWithNoTests: false` is set in `vitest.config.ts` — tests will fail if no test files match.
