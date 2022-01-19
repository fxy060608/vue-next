import type { ComponentInternalInstance } from '@vue/runtime-core'

export function isUndef(val: unknown) {
  return val === undefined || val === null
}

export function parseStylesheet(instance: ComponentInternalInstance) {
  return (
    (instance.type as { __stylesheet: Record<string, unknown> }).__stylesheet ||
    {}
  )
}
