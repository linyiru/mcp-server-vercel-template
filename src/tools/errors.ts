/**
 * MCP Tools: Error Helpers
 *
 * Standardized error format for all MCP tools.
 * Makes errors more actionable for AI agents.
 */

export type McpErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_INPUT'
  | 'PERMISSION_DENIED'
  | 'INTERNAL_ERROR'

interface McpError {
  error_code: McpErrorCode
  message: string
  suggestion?: string
  fix?: string
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: McpError) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: false,
        error_code: error.error_code,
        message: error.message,
        ...(error.suggestion && { suggestion: error.suggestion }),
        ...(error.fix && { fix: error.fix }),
      }),
    }],
  }
}

export function notFound(resource: string, id: string) {
  return createErrorResponse({
    error_code: 'NOT_FOUND',
    message: `${resource} with ID "${id}" not found.`,
    fix: `Use the list tool to see all available ${resource.toLowerCase()}s.`,
  })
}

export function alreadyExists(resource: string, identifier: string) {
  return createErrorResponse({
    error_code: 'ALREADY_EXISTS',
    message: `${resource} "${identifier}" already exists.`,
    fix: `Choose a different identifier or use the update tool.`,
  })
}

export function invalidInput(message: string, fix?: string) {
  return createErrorResponse({
    error_code: 'INVALID_INPUT',
    message,
    fix,
  })
}
