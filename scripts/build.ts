/**
 * Build script using Bun's native bundler.
 *
 * Outputs Build Output API v3 for Vercel deployment.
 * - Bundles src/index.ts → single index.js
 * - Copies .md resource files for runtime fs.readFileSync
 * - Generates .vc-config.json + config.json
 */

import { join, dirname } from 'node:path'
import { writeFileSync, mkdirSync, cpSync } from 'node:fs'

const root = dirname(import.meta.dir)
const funcDir = join(root, '.vercel/output/functions/index.func')
mkdirSync(funcDir, { recursive: true })

const result = await Bun.build({
  entrypoints: [join(root, 'src/index.ts')],
  outdir: funcDir,
  target: 'bun',
  sourcemap: 'linked',
  minify: false,
})

if (!result.success) {
  console.error('[build] Failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log(`[build] Bundle: ${result.outputs.map(o => o.path).join(', ')}`)

// Copy .md files for runtime fs.readFileSync
const resourcesDir = join(root, 'src/resources')
const outResourcesDir = join(funcDir, 'src/resources')
mkdirSync(outResourcesDir, { recursive: true })
for (const md of [
  'getting-started.md',
]) {
  cpSync(join(resourcesDir, md), join(outResourcesDir, md))
}
console.log('[build] Copied .md resource files')

// .vc-config.json
writeFileSync(
  join(funcDir, '.vc-config.json'),
  JSON.stringify({
    runtime: 'bun1.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    supportsResponseStreaming: true,
  }, null, 2)
)

// Build Output API v3 config
const outputDir = join(root, '.vercel/output')
writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify({
    version: 3,
    routes: [{ src: '/(.*)', dest: '/index' }],
  }, null, 2)
)

console.log('[build] Done!')
