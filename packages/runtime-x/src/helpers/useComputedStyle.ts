import { reactive } from '@vue/reactivity'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  warn,
} from '@vue/runtime-core'
import { EMPTY_ARR, camelize, hyphenate } from '@vue/shared'

export function useComputedStyle(
  keys: string[],
  options: {
    classAttr?: string // 允许和 styleAttr 同时存在
    styleAttr?: string
  } = {},
) {
  const i = getCurrentInstance()
  const r = reactive(new Map<string, unknown>())
  if (i) {
    if (keys.length === 0) {
      return r
    }
    const propsDef = i.propsOptions === EMPTY_ARR ? {} : i.propsOptions[0]!
    let { classAttr, styleAttr } = options
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
      keys,
      reactiveComputedStyle: r,
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
      const r = interceptor.reactiveComputedStyle
      // 前置步骤已经按照权重合并了classStyles和styles
      const styles = interceptor.styles
      for (const key in r) {
        const isCSSVar = key.startsWith('--')
        const camelizedKey = isCSSVar ? key : camelize(key)
        if (!styles || !styles.has(camelizedKey)) {
          r.set(key, '')
        } else {
          r.set(key, styles.get(camelizedKey))
        }
      }
      styles?.forEach((value, key) => {
        const isCSSVar = key.startsWith('--')
        const hyphenatedKey = isCSSVar ? key : hyphenate(key)
        r.set(hyphenatedKey, value)
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
        if (interceptor.keys.indexOf(key) !== -1) {
          interceptor.classStyles!.set(key, value)
          interceptor.classStylesWeight![key] = weight[key]
        }
      })
    })
  }
}
