import type { ComponentInternalInstance } from '@vue/runtime-core'
import { extend, hasOwn, isArray } from '@vue/shared'

interface NVueComponent {
  styles: Record<string, unknown>[]
  __styles: Record<string, unknown>
}

export function useCssStyles(styles: Record<string, unknown>[]) {
  const normalized: Record<string, unknown> = {}
  if (isArray(styles)) {
    styles.forEach(style => {
      Object.keys(style).forEach(name => {
        if (hasOwn(normalized, name)) {
          extend(normalized[name], style[name])
        } else {
          normalized[name] = style[name]
        }
      })
    })
  }
  return normalized
}

export function parseStylesheet({
  type,
  vnode: { appContext }
}: ComponentInternalInstance) {
  if (!(type as NVueComponent).__styles) {
    const styles: Record<string, unknown>[] = []
    if (appContext) {
      styles.push(appContext.provides.__appStyles)
    }
    ;(type as NVueComponent).styles.forEach(style => styles.push(style))
    ;(type as NVueComponent).__styles = useCssStyles(styles)
  }
  return (type as NVueComponent).__styles
}
