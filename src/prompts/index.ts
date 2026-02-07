/**
 * MCP Prompts
 *
 * Example prompt registration. Prompts provide reusable instruction templates
 * that MCP clients can invoke to guide AI behavior.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

export function registerPrompts(server: McpServer) {
  server.prompt(
    'summarize-notes',
    'Summarize all notes into a brief overview',
    {},
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Please list all notes using the list_notes tool and provide a brief summary of each one.',
          },
        },
      ],
    })
  )

  server.prompt(
    'draft-note',
    'Help draft a new note on a given topic',
    { topic: z.string().describe('The topic to write about') },
    async ({ topic }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me draft a note about: ${topic}\n\nCreate a well-structured note with a clear title and organized content. Use the create_note tool to save it.`,
          },
        },
      ],
    })
  )
}
