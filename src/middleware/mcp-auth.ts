/**
 * MCP Authentication Middleware
 *
 * Verifies Bearer tokens using JWKS (jose library).
 * Supports both JWT and opaque access tokens:
 * - JWT tokens: Verified locally using JWKS endpoint
 * - Opaque tokens: Verified via an optional callback (setOpaqueTokenVerifier)
 *
 * Set AUTH_SKIP=true in development to bypass authentication.
 */

import type { MiddlewareHandler } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AppEnv } from '../env.js'
import { config } from '../config.js'

// Lazily initialized JWKS keyset
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJWKS() {
  if (!_jwks) {
    _jwks = createRemoteJWKSet(new URL(config.auth.jwksUrl))
  }
  return _jwks
}

/**
 * Optional opaque token verifier.
 * Call setOpaqueTokenVerifier() in app.ts to enable opaque token support.
 * Should return the user ID (subject) if valid, or null if invalid.
 */
type OpaqueTokenVerifier = (token: string) => Promise<string | null>
let _opaqueVerifier: OpaqueTokenVerifier | null = null

export function setOpaqueTokenVerifier(verifier: OpaqueTokenVerifier) {
  _opaqueVerifier = verifier
}

/** Check if token is JWT (has 3 dot-separated parts) or opaque */
function isJwtToken(token: string): boolean {
  return token.split('.').length === 3
}

/** Verify JWT token using JWKS */
async function verifyJwtToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: config.auth.issuer,
      audience: config.auth.audiences,
      clockTolerance: 60,
    })
    return payload.sub ?? null
  } catch (e) {
    console.log('[MCP Auth] JWT verification failed:', e instanceof Error ? e.message : e)
    return null
  }
}

function unauthorizedResponse(message = 'Unauthorized'): Response {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
  }
  // Include resource_metadata hint if issuer is configured
  if (config.auth.issuer !== 'http://localhost:3000') {
    headers['WWW-Authenticate'] =
      `Bearer resource_metadata="${config.auth.issuer}/.well-known/oauth-protected-resource"`
  }
  return new Response(message, { status: 401, headers })
}

/**
 * Hono middleware that verifies MCP auth tokens and sets userId.
 * Set AUTH_SKIP=true to bypass (development only).
 */
export const mcpAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Skip auth in development
  if (config.auth.skip) {
    c.set('userId', 'dev-user')
    await next()
    return
  }

  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorizedResponse()
  }

  const token = authHeader.replace('Bearer ', '')

  if (isJwtToken(token)) {
    const userId = await verifyJwtToken(token)
    if (!userId) {
      return unauthorizedResponse('Unauthorized - invalid or expired JWT')
    }
    c.set('userId', userId)
  } else {
    // Opaque token
    if (!_opaqueVerifier) {
      return unauthorizedResponse('Unauthorized - opaque tokens not supported')
    }
    const userId = await _opaqueVerifier(token)
    if (!userId) {
      return unauthorizedResponse('Unauthorized - invalid token')
    }
    c.set('userId', userId)
  }

  await next()
}
