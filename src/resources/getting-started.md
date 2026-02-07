# Getting Started

Welcome to your MCP server! This guide will help you customize it for your use case.

## Architecture Overview

This server is built with:

- **Hono** — Lightweight web framework for routing and middleware
- **mcp-handler** — MCP protocol handler with session management
- **jose** — JWT/JWKS verification for authentication
- **Bun** — Runtime and bundler (deployed on Vercel)

## Key Concepts

### Service Proxy Pattern

The `context.ts` file provides a Proxy-based service injection pattern:

```typescript
import { services } from '../context.js'

// In your tools:
const notes = await services.notes.list()
```

This pattern keeps heavy dependencies (like database clients) out of the static
module graph, preventing Bun's ESM linker errors when many files share the same
dependency.

### Adding New Tools

1. Create a new file in `src/tools/` (e.g., `src/tools/my-tool.ts`)
2. Export a `registerMyTools(server: McpServer)` function
3. Import and call it in `src/server.ts`
4. Re-export from `src/tools/index.ts`

### Adding New Services

1. Add your interface to `src/services/types.ts`
2. Implement it in a new file (e.g., `src/services/database.ts`)
3. Replace `InMemoryServices` in `src/app.ts`

## Deployment

```bash
# Install dependencies
bun install

# Type check
tsc --noEmit

# Build for Vercel
bun scripts/build.ts

# Deploy
vercel deploy
```

## Environment Variables

See `.env.example` for all available configuration options.
