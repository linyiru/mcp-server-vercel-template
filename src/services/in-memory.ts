/**
 * In-Memory Service Implementation
 *
 * Example implementation using a Map for storage.
 * Replace with your own implementation (database, external API, etc.)
 */

import type { Note, Services } from './types.js'

export class InMemoryServices implements Services {
  private store = new Map<string, Note>()
  private nextId = 1

  constructor() {
    // Seed with example data
    this.seedData()
  }

  private seedData() {
    const seeds = [
      { title: 'Welcome', content: 'Welcome to your MCP server! This is a sample note.' },
      { title: 'Getting Started', content: 'Check out the README for setup instructions and customization guide.' },
      { title: 'Architecture', content: 'This server uses Hono + Bun on Vercel with the MCP protocol.' },
    ]
    for (const seed of seeds) {
      const id = String(this.nextId++)
      const now = new Date()
      this.store.set(id, { id, ...seed, createdAt: now, updatedAt: now })
    }
  }

  notes = {
    list: async (): Promise<Note[]> => {
      return Array.from(this.store.values()).sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )
    },

    get: async (id: string): Promise<Note | null> => {
      return this.store.get(id) ?? null
    },

    create: async (title: string, content: string): Promise<Note> => {
      const id = String(this.nextId++)
      const now = new Date()
      const note: Note = { id, title, content, createdAt: now, updatedAt: now }
      this.store.set(id, note)
      return note
    },

    delete: async (id: string): Promise<boolean> => {
      return this.store.delete(id)
    },

    search: async (query: string): Promise<Note[]> => {
      const q = query.toLowerCase()
      return Array.from(this.store.values()).filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
    },
  }
}
