/**
 * Service Proxy
 *
 * Provides a lazy-initialized proxy for the services layer.
 * Tool files import `services` without pulling the concrete implementation
 * into the static ESM module graph — the runtime injection happens in app.ts.
 *
 * This pattern prevents Bun's "Requested module is not instantiated yet" error
 * when many tool files transitively depend on the same heavy module.
 */

import type { Services } from './services/types.js'

let _services: Services

export function initServices(impl: Services) {
  _services = impl
}

export const services: Services = new Proxy({} as Services, {
  get(_, prop, receiver) {
    if (!_services) {
      throw new Error(
        'Services not initialized. Call initServices() before accessing the proxy.'
      )
    }
    return Reflect.get(_services, prop, receiver)
  },
})
