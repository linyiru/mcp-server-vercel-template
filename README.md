# MCP Server Vercel Template

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server template, deployable to **Vercel** with **Bun** runtime in under 5 minutes.

## Features

- **Hono** web framework with CORS, middleware, and typed context
- **Bun native bundler** → single `index.js` via Build Output API v3
- **JWT authentication** via JWKS (jose) with optional opaque token support
- **Service injection** via Proxy pattern (swap in your own database/API layer)
- **MCP transports**: Streamable HTTP (POST /) and SSE (`/sse` + `/message`)
- **OAuth metadata**: RFC 9728 `/.well-known/oauth-protected-resource`
- **3 example tools**: Notes CRUD, Weather API, Documentation reader

## Quick Start

### 1. Create from template

Click **"Use this template"** on GitHub, or:

```bash
git clone https://github.com/user/mcp-server-vercel-template.git my-mcp-server
cd my-mcp-server
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure

Copy `.env.example` to `.env` and set `AUTH_SKIP=true` for local development:

```bash
cp .env.example .env
echo 'AUTH_SKIP=true' >> .env
```

### 4. Build & verify

```bash
bun scripts/build.ts
```

### 5. Deploy to Vercel

```bash
vercel deploy
```

## Project Structure

```
src/
├── index.ts                  # Entry point (re-exports app)
├── app.ts                    # Hono app: CORS, routes, MCP handler, OAuth metadata
├── config.ts                 # Centralized configuration from env vars
├── env.ts                    # Hono context type definitions
├── context.ts                # Service Proxy (lazy initialization)
├── server.ts                 # Tool/prompt registration
├── middleware/
│   └── mcp-auth.ts           # JWT (jose) + opaque token verification
├── services/
│   ├── types.ts              # Service interface definitions
│   └── in-memory.ts          # Example: in-memory implementation
├── tools/
│   ├── index.ts              # Barrel export
│   ├── errors.ts             # Standardized error responses
│   ├── notes.ts              # Example: CRUD tools (services proxy)
│   └── weather.ts            # Example: external API tool (Open-Meteo)
├── prompts/
│   └── index.ts              # Example MCP prompts
└── resources/
    ├── index.ts              # Lazy fs.readFileSync loader
    └── getting-started.md    # Example documentation
scripts/
└── build.ts                  # Bun bundler → Build Output API v3
```

## Architecture

### Service Proxy Pattern

The core pattern that makes this template work is the **service injection proxy** in `context.ts`:

```typescript
// context.ts — tools import this proxy
import type { Services } from './services/types.js'

let _services: Services
export function initServices(impl: Services) { _services = impl }
export const services: Services = new Proxy({} as Services, {
  get(_, prop, receiver) { return Reflect.get(_services, prop, receiver) }
})
```

```typescript
// tools/notes.ts — uses the proxy, no concrete dependency
import { services } from '../context.js'
const notes = await services.notes.list()
```

```typescript
// app.ts middleware — injects the concrete implementation once
initServices(new InMemoryServices())
```

**Why?** When 10+ tool files all import the same heavy module (like a database client), Bun's ESM linker can fail with "Requested module is not instantiated yet". The proxy keeps heavy imports isolated in `app.ts`.

### Authentication

JWT verification via [jose](https://github.com/panva/jose) using a JWKS endpoint:

- **JWT tokens**: Verified locally with `jwtVerify()` + `createRemoteJWKSet()`
- **Opaque tokens**: Optional callback via `setOpaqueTokenVerifier()`
- **Development**: Set `AUTH_SKIP=true` to bypass all auth

### Build System

Bun's native bundler produces a single `index.js` file, then the build script generates Vercel's Build Output API v3 structure:

```
.vercel/output/
├── config.json              # Route config
└── functions/
    └── index.func/
        ├── index.js         # Bundled application
        ├── .vc-config.json  # Bun runtime config
        └── src/resources/   # Copied .md files
```

### MCP Transports

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Server discovery (unauthenticated) |
| `/` | POST | Streamable HTTP transport |
| `/` | DELETE | Session cleanup |
| `/sse` | GET | SSE transport |
| `/message` | POST | HTTP message transport |
| `/.well-known/oauth-protected-resource` | GET | OAuth metadata (RFC 9728) |

## Customization Guide

### Replace the service layer

1. Define your interfaces in `src/services/types.ts`
2. Create an implementation (e.g., `src/services/database.ts`)
3. In `src/app.ts`, replace `new InMemoryServices()` with your implementation

### Add a new tool

1. Create `src/tools/my-tool.ts`:
   ```typescript
   import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
   import { z } from 'zod'
   import { services } from '../context.js'

   export function registerMyTools(server: McpServer) {
     server.tool('my_tool', 'Description', { param: z.string() }, async ({ param }) => {
       // Your logic here
       return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] }
     })
   }
   ```
2. Export from `src/tools/index.ts`
3. Call `registerMyTools(server)` in `src/server.ts`

### Add documentation resources

1. Add `.md` files to `src/resources/`
2. Register them in `src/resources/index.ts` (TITLES + FILES maps)
3. Add the filename to `scripts/build.ts` copy list

### Configure authentication

Set these environment variables (or in Vercel dashboard):

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_ISSUER` | JWT issuer URL | `https://auth.example.com` |
| `AUTH_JWKS_URL` | JWKS endpoint | `https://auth.example.com/.well-known/jwks.json` |
| `AUTH_AUDIENCES` | Accepted audiences (comma-separated) | `https://mcp.example.com` |
| `AUTH_SKIP` | Skip auth (dev only) | `true` |

### Enable Redis sessions

Set `REDIS_URL` to persist MCP sessions across serverless invocations:

```bash
REDIS_URL="redis://your-redis-host:6379"
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `hono` | Web framework |
| `mcp-handler` | MCP protocol + session management |
| `@modelcontextprotocol/sdk` | MCP type definitions |
| `jose` | JWT/JWKS verification |
| `@vercel/functions` | Vercel runtime helpers |
| `zod` | Parameter validation |

## License

MIT
