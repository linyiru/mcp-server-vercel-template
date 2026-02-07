/**
 * MCP Server Registration
 *
 * Registers all tools, prompts, and resources with the MCP server.
 * This is the main configuration point — add your tools here.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { registerNoteTools, registerWeatherTools } from './tools/index.js'
import { registerPrompts as registerAllPrompts } from './prompts/index.js'
import { DOC_TOPICS, getDocumentation, getDocTopicList } from './resources/index.js'

/**
 * Instructions sent to AI clients at connection time.
 * Customize this to describe your server's capabilities.
 */
export const SERVER_INSTRUCTIONS = `
You are connected to an MCP server. Available capabilities:

## Tools

### Notes (CRUD)
- list_notes: List all notes
- get_note: Get a note by ID
- create_note: Create a new note
- delete_note: Delete a note
- search_notes: Search notes by title or content

### Weather
- get_weather: Get current weather for any city (via Open-Meteo)

### Documentation
- get_documentation: Read server documentation

## Workflow
1. Use list_notes to see existing notes
2. Use create_note to add new ones
3. Use get_weather for weather queries
4. Use get_documentation to learn about the server
`.trim()

/**
 * Register all MCP tools
 */
export function registerTools(server: McpServer, _userId: string) {
  // Note tools (CRUD via services proxy)
  registerNoteTools(server)

  // Weather tool (external API)
  registerWeatherTools(server)

  // Documentation tool (static .md files)
  server.tool(
    'get_documentation',
    `Get server documentation. Available topics:\n${getDocTopicList()}`,
    { topic: z.enum(DOC_TOPICS).describe('Documentation topic to retrieve') },
    async ({ topic }) => ({
      content: [{ type: 'text', text: getDocumentation(topic) }],
    })
  )
}

/**
 * Register all MCP prompts
 */
export function registerPrompts(server: McpServer) {
  registerAllPrompts(server)
}
