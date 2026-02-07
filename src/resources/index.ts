/**
 * MCP Documentation Module
 *
 * Markdown files are read at runtime via fs.readFileSync.
 * This avoids module resolution issues — Bun's bundler can't inline .md files.
 * Exposed as a get_documentation tool (simpler than MCP resources).
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function readMd(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), 'utf-8')
}

const TITLES = {
  'getting-started': 'Getting Started Guide',
} as const

const FILES: Record<DocTopic, string> = {
  'getting-started': './getting-started.md',
}

// Lazy-loaded cache: read from disk on first access
let _content: Record<DocTopic, string> | null = null

function getContent(): Record<DocTopic, string> {
  if (!_content) {
    _content = {} as Record<DocTopic, string>
    for (const [topic, path] of Object.entries(FILES)) {
      _content[topic as DocTopic] = readMd(path)
    }
  }
  return _content
}

export type DocTopic = keyof typeof TITLES
export const DOC_TOPICS = Object.keys(TITLES) as [DocTopic, ...DocTopic[]]

export function getDocumentation(topic: DocTopic): string {
  return getContent()[topic]
}

export function getDocTopicList(): string {
  return Object.entries(TITLES)
    .map(([key, title]) => `- ${key}: ${title}`)
    .join('\n')
}
