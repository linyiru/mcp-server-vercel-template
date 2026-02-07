/**
 * Service Interface
 *
 * Define your application's service layer here.
 * The context.ts proxy delegates to a concrete implementation at runtime.
 *
 * Replace this with your own domain-specific interfaces (e.g., database access,
 * external APIs, etc.)
 */

export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface Services {
  notes: {
    list(): Promise<Note[]>
    get(id: string): Promise<Note | null>
    create(title: string, content: string): Promise<Note>
    delete(id: string): Promise<boolean>
    search(query: string): Promise<Note[]>
  }
}
