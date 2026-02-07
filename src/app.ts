/**
 * Hono Application
 *
 * Main application setup:
 * - CORS for all routes
 * - Service layer initialization (lazy singleton)
 * - Server discovery endpoint (unauthenticated)
 * - OAuth Protected Resource Metadata (RFC 9728)
 * - MCP transport routes (authenticated)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { initServices } from './context.js'
import { config } from './config.js'
import type { AppEnv } from './env.js'
import { mcpAuth } from './middleware/mcp-auth.js'
import { InMemoryServices } from './services/in-memory.js'

const app = new Hono<AppEnv>()

// Initialize services singleton on first request
let _servicesReady = false
app.use('*', async (_c, next) => {
  if (!_servicesReady) {
    // Replace InMemoryServices with your own implementation
    initServices(new InMemoryServices())
    _servicesReady = true
  }
  await next()
})

// CORS for all routes
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['WWW-Authenticate'],
    maxAge: 86400,
  })
)

// =============================================================================
// Server Discovery (unauthenticated)
// =============================================================================

const serverInfo = {
  name: config.serverName,
  title: config.serverName,
  version: config.serverVersion,
  description: `${config.serverName} - Model Context Protocol server`,
  endpoints: {
    sse: '/sse',
    message: '/message',
  },
  ...(config.auth.issuer !== 'http://localhost:3000' && {
    oauth: {
      discovery: `${config.auth.issuer}/.well-known/oauth-protected-resource`,
    },
  }),
}

app.get('/', (c) => c.json(serverInfo))

// OAuth Protected Resource Metadata (RFC 9728)
app.get('/.well-known/oauth-protected-resource', (c) => {
  return c.json(
    {
      resource: config.isProduction
        ? `https://${c.req.header('host')}/`
        : `http://localhost:3000/`,
      authorization_servers: [config.auth.issuer],
      jwks_uri: config.auth.jwksUrl,
      bearer_methods_supported: ['header'],
      resource_name: config.serverName,
    },
    200,
    { 'Cache-Control': 'public, max-age=3600' }
  )
})

// =============================================================================
// MCP Handler Factory
// =============================================================================

async function createUserMcpHandler(userId: string) {
  const [{ createMcpHandler }, { SERVER_INSTRUCTIONS, registerPrompts, registerTools }] =
    await Promise.all([import('mcp-handler'), import('./server.js')])
  return createMcpHandler(
    (server) => {
      registerTools(server, userId)
      registerPrompts(server)
    },
    {
      serverInfo: {
        name: config.serverName.toLowerCase().replace(/\s+/g, '-'),
        version: config.serverVersion,
        ...({
          title: config.serverName,
          description: `${config.serverName} - Model Context Protocol server`,
        } as Record<string, unknown>),
      },
      instructions: SERVER_INSTRUCTIONS,
      capabilities: {
        tools: {},
        prompts: {},
      },
    },
    {
      redisUrl: config.redisUrl,
      basePath: '/',
      maxDuration: 60,
      verboseLogs: !config.isProduction,
    }
  )
}

// =============================================================================
// MCP Transport Routes (authenticated)
// =============================================================================

async function handleTransport(req: Request, userId: string): Promise<Response> {
  try {
    const handler = await createUserMcpHandler(userId)
    const response = await handler(req)
    return response ?? new Response('Internal Server Error', { status: 500 })
  } catch (e) {
    console.error('[MCP] Transport handler error:', e)
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}

// Streamable HTTP transport (POST /) - rewrite to /mcp for mcp-handler
app.post('/', mcpAuth, async (c) => {
  const url = new URL(c.req.url)
  const rewrittenUrl = new URL('/mcp', url.origin)
  rewrittenUrl.search = url.search
  const rewrittenReq = new Request(rewrittenUrl, {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    duplex: 'half',
  } as RequestInit)
  return handleTransport(rewrittenReq, c.var.userId)
})

// DELETE / - session cleanup
app.delete('/', mcpAuth, async (c) => {
  return handleTransport(c.req.raw, c.var.userId)
})

// SSE transport
app.get('/sse', mcpAuth, async (c) => {
  return handleTransport(c.req.raw, c.var.userId)
})

// HTTP message transport
app.post('/message', mcpAuth, async (c) => {
  return handleTransport(c.req.raw, c.var.userId)
})

// Catch-all for other transport paths
app.all('/mcp', mcpAuth, async (c) => {
  return handleTransport(c.req.raw, c.var.userId)
})

export default app
