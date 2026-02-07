/**
 * Server Configuration
 *
 * Centralized configuration from environment variables with sensible defaults.
 * Override via .env or Vercel environment settings.
 */

export const config = {
  /** Server name displayed to MCP clients */
  serverName: process.env.MCP_SERVER_NAME || 'MCP Server',

  /** Server version */
  serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',

  /** Whether running in production */
  isProduction: process.env.NODE_ENV === 'production',

  auth: {
    /** OAuth issuer (must match JWT `iss` claim) */
    issuer: process.env.AUTH_ISSUER || 'http://localhost:3000',

    /** JWKS endpoint for JWT verification */
    jwksUrl: process.env.AUTH_JWKS_URL || 'http://localhost:3000/.well-known/jwks.json',

    /** Accepted JWT audiences (comma-separated in env) */
    audiences: (process.env.AUTH_AUDIENCES || 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim()),

    /** Skip auth entirely (for local development) */
    skip: process.env.AUTH_SKIP === 'true',
  },

  /** Redis URL for MCP session persistence (optional) */
  redisUrl: process.env.REDIS_URL,
} as const
