import { reactive } from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  warn,
} from '@vue/runtime-core'
import { EMPTY_ARR, camelize, hyphenate } from '@vue/shared'
import { mergeClassStyles } from './useCssStyles'

export function useComputedStyle(
  options: {
    classAttr?: string // 允许和 styleAttr 同时存在
    styleAttr?: string
    properties?: string[]
    filterProperties?: boolean
  } = {},
) {
  const i = getCurrentInstance()
  const r = reactive(new Map<string, unknown>())
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

export function triggerComputedStyleUpdate(
  instance: ComponentInternalInstance,
) {
  if (instance.computedStyleInterceptors) {
    instance.computedStyleInterceptors.forEach(interceptor => {
      if (
        interceptor.classAttr !== 'class' ||
        interceptor.styleAttr !== 'style'
      ) {
        return
      }

      let styles = interceptor.styles
      if (
        interceptor.classAttr === 'class' &&
        interceptor.classStyles &&
        interceptor.classStylesWeight
      ) {
        styles = mergeClassStyles(
          interceptor.classStyles,
          interceptor.classStylesWeight,
          interceptor.styles,
        )
      }

      const r = interceptor.reactiveComputedStyle
      for (const key in r) {
        const isCSSVar = key.startsWith('--')
        const camelizedKey = isCSSVar ? key : camelize(key)
        if (!styles || !styles.has(camelizedKey)) {
          r.delete(key)
        } else {
          r.set(key, styles.get(camelizedKey))
        }
      }
      styles?.forEach((value, key) => {
        const isCSSVar = key.startsWith('--')
        const hyphenatedKey = isCSSVar ? key : hyphenate(key)
        if (value === '' || value == null) {
          r.delete(hyphenatedKey)
        } else {
          r.set(hyphenatedKey, value)
        }
      })
    })
  }
}

export function collectClassStyles(
  instance: ComponentInternalInstance,
  styles: Map<string, any>,
  weight: Record<string, number>,
) {
  if (instance.computedStyleInterceptors) {
    instance.computedStyleInterceptors.forEach(interceptor => {
      if (interceptor.classAttr !== 'class') {
        return
      }
      interceptor.classStyles = interceptor.classStyles || new Map()
      interceptor.classStyles.clear()
      interceptor.classStylesWeight = {}
      styles.forEach((value, key) => {
        const isCSSVar = key.startsWith('--')
        const hyphenatedKey = isCSSVar ? key : hyphenate(key)
        if (
          !interceptor.properties ||
          interceptor.properties.indexOf(hyphenatedKey) !== -1
        ) {
          interceptor.classStyles!.set(key, value)
          interceptor.classStylesWeight![key] = weight[key]
        }
      })
    })
  }
}
