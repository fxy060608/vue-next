import type { ComponentInternalInstance } from '@vue/runtime-core'
import { extend, hasOwn, isArray } from '@vue/shared'

interface NVueComponent {
  mpType: 'page' | 'app'
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
  const component = type as NVueComponent
  if (!component.__styles) {
    if (component.mpType === 'page' && appContext) {
      // 如果是页面组件，则直接使用全局样式
      component.__styles = appContext.provides.__globalStyles
    } else {
      const styles: Record<string, unknown>[] = []
      if (appContext) {
        // 全局样式，包括 app.css 以及 page.css
        styles.push(appContext.provides.__globalStyles)
      }
      if (isArray(component.styles)) {
        component.styles.forEach(style => styles.push(style))
      }
      component.__styles = useCssStyles(styles)
    }
  }
  return component.__styles
}
