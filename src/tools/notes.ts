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
  server.tool(
    'list_notes',
    'List all notes, sorted by last updated',
    {},
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

  server.tool(
    'get_note',
    'Get a note by its ID',
    { id: z.string().describe('The note ID') },
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

  server.tool(
    'create_note',
    'Create a new note',
    {
      title: z.string().describe('Note title'),
      content: z.string().describe('Note content (markdown supported)'),
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

  server.tool(
    'delete_note',
    'Delete a note by ID',
    { id: z.string().describe('The note ID to delete') },
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

  server.tool(
    'search_notes',
    'Search notes by title or content',
    { query: z.string().describe('Search query') },
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
