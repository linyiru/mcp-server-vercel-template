/**
 * Hono Environment Types
 *
 * Defines context variables available in route handlers and middleware.
 */

export type Variables = {
  /** Authenticated user ID (set by mcpAuth middleware) */
  userId: string
}

export type AppEnv = {
  Variables: Variables
}
