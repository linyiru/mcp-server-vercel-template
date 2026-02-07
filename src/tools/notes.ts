/**
 * Notes Tools
 *
 * Example CRUD tools demonstrating the services proxy pattern.
 * Replace with your own domain-specific tools.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { services } from '../context.js'
import { notFound } from './errors.js'

export function registerNoteTools(server: McpServer) {
  server.registerTool(
    'list_notes',
    {
      title: 'List Notes',
      description: 'List all notes, sorted by last updated',
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const notes = await services.notes.list()
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: notes.length,
            notes: notes.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content.substring(0, 100) + (n.content.length > 100 ? '...' : ''),
              updatedAt: n.updatedAt.toISOString(),
            })),
          }),
        }],
      }
    }
  )

  server.registerTool(
    'get_note',
    {
      title: 'Get Note',
      description: 'Get a note by its ID',
      inputSchema: { id: z.string().describe('The note ID') },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const note = await services.notes.get(id)
      if (!note) return notFound('Note', id)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, note }),
        }],
      }
    }
  )

  server.registerTool(
    'create_note',
    {
      title: 'Create Note',
      description: 'Create a new note',
      inputSchema: {
        title: z.string().describe('Note title'),
        content: z.string().describe('Note content (markdown supported)'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ title, content }) => {
      const note = await services.notes.create(title, content)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, note }),
        }],
      }
    }
  )

  server.registerTool(
    'delete_note',
    {
      title: 'Delete Note',
      description: 'Delete a note by ID',
      inputSchema: { id: z.string().describe('The note ID to delete') },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const deleted = await services.notes.delete(id)
      if (!deleted) return notFound('Note', id)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, message: `Note ${id} deleted.` }),
        }],
      }
    }
  )

  server.registerTool(
    'search_notes',
    {
      title: 'Search Notes',
      description: 'Search notes by title or content',
      inputSchema: { query: z.string().describe('Search query') },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ query }) => {
      const notes = await services.notes.search(query)
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            query,
            count: notes.length,
            notes: notes.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content.substring(0, 100) + (n.content.length > 100 ? '...' : ''),
            })),
          }),
        }],
      }
    }
  )
}
