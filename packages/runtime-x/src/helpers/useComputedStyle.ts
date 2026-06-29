import { reactive } from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  warn,
} from '@vue/runtime-core'
import { camelize } from '@vue/shared'

export function useComputedStyle(options: {
  properties: string[]
  filterProperties?: boolean
}) {
  const i = getCurrentInstance()
  const r = reactive(new Map<string, string>())
  if (i) {
    const properties = options.properties ?? []
    const filterProperties = options.filterProperties ?? true
    const computedStyleInterceptor = {
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

const notPxKeys = new Set<string>([
  'z-index',
  'opacity',
  'font-weight',
  'line-height',
  'flex-grow',
  'flex-shrink',
  'flex',
])

// const colorKeys = new Set<string>([
//   'color',
//   'background-color',
//   'border-color',
//   'border-left-color',
//   'border-right-color',
//   'border-top-color',
//   'border-bottom-color',
//   'text-decoration-color',
// ])

// function isColorKey(key: string): boolean {
//   return colorKeys.has(key)
// }

function isPxKey(key: string): boolean {
  return !notPxKeys.has(key)
}

function formatValue(key: string, value: number | string): string {
  if (typeof value != 'number') {
    return value
  }
  if (isPxKey(key)) {
    return `${value}px`
  }
  return `${value}`
}

export function triggerComputedStyleUpdate(
  instance: ComponentInternalInstance,
  styles: Map<string, any>,
): Map<string, any> {
  if (instance.computedStyleInterceptors) {
    instance.computedStyleInterceptors.forEach(interceptor => {
      const r = interceptor.reactiveComputedStyle
      const properties = interceptor.properties
      for (const property of properties) {
        const camelizedProperty = camelize(property)
        const hasProperty = styles.has(property)
        const hasCamelizedProperty = styles.has(camelizedProperty)
        if (hasProperty || hasCamelizedProperty) {
          r.set(
            property,
            formatValue(
              property,
              hasProperty
                ? styles.get(property)
                : styles.get(camelizedProperty),
            ),
          )
          if (interceptor.filterProperties) {
            styles.delete(property)
          }
        } else {
          r.delete(property)
        }
      }
    })
  }
  return styles
}
