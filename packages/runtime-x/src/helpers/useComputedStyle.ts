import { reactive } from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  warn,
} from '@vue/runtime-core'
import { EMPTY_ARR, hyphenate } from '@vue/shared'

export function useComputedStyle(
  options: {
    classAttr?: string // 允许和 styleAttr 同时存在
    styleAttr?: string
    properties?: string[]
    filterProperties?: boolean
  } = {},
) {
  const i = getCurrentInstance()
  const r = reactive(new Map<string, string>())
  if (i) {
    const propsDef = i.propsOptions === EMPTY_ARR ? {} : i.propsOptions[0]!
    let { classAttr, styleAttr, properties } = options
    let filterProperties = options.filterProperties ?? true
    if (classAttr || styleAttr) {
      if (classAttr && classAttr in propsDef) {
        classAttr = undefined
      }
      if (styleAttr && styleAttr in propsDef) {
        styleAttr = undefined
      }
    } else if (!('class' in propsDef) && !('style' in propsDef)) {
      classAttr = 'class'
      styleAttr = 'style'
    }
    const computedStyleInterceptor = {
      classAttr,
      styleAttr,
      properties,
      reactiveComputedStyle: r,
      filterProperties,
    }
    i.computedStyleInterceptors = i.computedStyleInterceptors || []
    i.computedStyleInterceptors.push(computedStyleInterceptor)
  } else if (__DEV__) {
    warn(
      `useComputedStyle() is called when there is no active component ` +
        `instance to be associated with.`,
    )
  }
  return r
}

const excludedPxKeys = new Set<string>([
  'z-index',
  'opacity',
  'font-weight',
  'line-height',
  'flex-grow',
  'flex-shrink',
  'flex',
])

function formatValue(key: string, value: number | string): string {
  if (typeof value != 'number') {
    return value
  }
  if (isPxKey(key)) {
    return `${value}px`
  }
  return `${value}`
}

function isPxKey(key: string): boolean {
  return !excludedPxKeys.has(key)
}

export function triggerComputedStyleUpdate(
  instance: ComponentInternalInstance,
  styles: Map<string, any>,
): Map<string, any> {
  if (instance.computedStyleInterceptors) {
    const keysToDelete = new Set<string>()
    let clearStyles = false
    instance.computedStyleInterceptors.forEach(interceptor => {
      const r = interceptor.reactiveComputedStyle
      const properties = interceptor.properties
      if (properties) {
        styles.forEach((value, key) => {
          const isCSSVar = key.startsWith('--')
          const hyphenatedKey = isCSSVar ? key : hyphenate(key)
          if (properties.includes(hyphenatedKey)) {
            if (value === '' || value == null) {
              r.delete(hyphenatedKey)
            } else {
              r.set(hyphenatedKey, formatValue(hyphenatedKey, value))
            }
            if (interceptor.filterProperties) {
              keysToDelete.add(key)
            }
          }
        })
      } else {
        styles.forEach((value, key) => {
          const isCSSVar = key.startsWith('--')
          const hyphenatedKey = isCSSVar ? key : hyphenate(key)
          if (value === '' || value == null) {
            r.delete(hyphenatedKey)
          } else {
            r.set(hyphenatedKey, formatValue(hyphenatedKey, value))
          }
        })
        clearStyles = true
      }
    })
    if (clearStyles) {
      styles.clear()
    } else if (keysToDelete.size > 0) {
      keysToDelete.forEach(key => {
        styles.delete(key)
      })
    }
  }
  return styles
}
