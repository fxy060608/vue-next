import type { ComponentInternalInstance } from '@vue/runtime-core'
import { extend, hasOwn, isArray } from '@vue/shared'

export function isUndef(val: unknown) {
  return val === undefined || val === null
}

interface NVueComponent {
  styles: Record<string, unknown>[]
  __styles: Record<string, unknown>
}

export function parseStylesheet({ type }: ComponentInternalInstance) {
  if (!(type as NVueComponent).__styles) {
    const { styles } = type as NVueComponent
    const normalizedStyles: Record<string, unknown> = {}
    if (isArray(styles)) {
      styles.forEach(style => {
        Object.keys(style).forEach(name => {
          if (hasOwn(normalizedStyles, name)) {
            extend(normalizedStyles[name], style[name])
          } else {
            normalizedStyles[name] = style[name]
          }
        })
      })
    }
    ;(type as NVueComponent).__styles = normalizedStyles
  }
  return (type as NVueComponent).__styles
}
