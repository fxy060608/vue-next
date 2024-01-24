import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import { hasOwn, isArray } from '@vue/shared'
import { getExtraStyle, getExtraStyles } from './node'

type NVueStyle = Record<string, Record<string, Record<string, unknown>>>

interface NVueComponent {
  mpType: 'page' | 'app'
  styles: NVueStyle[]
  __styles: NVueStyle
}

function each(obj: Record<string, unknown>) {
  return Object.keys(obj)
}

export function useCssStyles(componentStyles: NVueStyle[]) {
  const normalized: NVueStyle = {}
  if (!isArray(componentStyles)) {
    return normalized
  }
  componentStyles.forEach(componentStyle => {
    each(componentStyle).forEach(className => {
      const parentStyles = componentStyle[className]
      const normalizedStyles =
        normalized[className] || (normalized[className] = {})
      each(parentStyles).forEach(parentSelector => {
        const parentStyle = parentStyles[parentSelector]
        const normalizedStyle =
          normalizedStyles[parentSelector] ||
          (normalizedStyles[parentSelector] = {})
        each(parentStyle).forEach(name => {
          if (name[0] === '!') {
            // 如果以包含important属性，则移除非important
            normalizedStyle[name] = parentStyle[name]
            delete normalizedStyle[name.slice(1)]
          } else {
            // 当前属性非important，且不存在同名important属性
            if (!hasOwn(normalizedStyle, '!' + name)) {
              normalizedStyle[name] = parentStyle[name]
            }
          }
        })
      })
    })
  })
  return normalized
}

function hasClass(calssName: string, el: UniXElement | null) {
  const classList = el && el.classList
  return classList && classList.includes(calssName)
}

const TYPE_RE = /[+~> ]$/
const PROPERTY_PARENT_NODE = 'parentNode'
const PROPERTY_PREVIOUS_SIBLING = 'previousSibling'
function isMatchParentSelector(parentSelector: string, el: UniXElement | null) {
  const classArray = parentSelector.split('.')
  for (let i = classArray.length - 1; i > 0; i--) {
    const item = classArray[i]
    const type = item[item.length - 1]
    const className = item.replace(TYPE_RE, '')
    if (type === '~' || type === ' ') {
      const property =
        type === '~' ? PROPERTY_PREVIOUS_SIBLING : PROPERTY_PARENT_NODE
      while (el) {
        el = el[property]
        if (hasClass(className, el)) {
          break
        }
      }
      if (!el) {
        return false
      }
    } else {
      if (type === '>') {
        el = el && el[PROPERTY_PARENT_NODE]
      } else if (type === '+') {
        el = el && el[PROPERTY_PREVIOUS_SIBLING]
      }
      if (!hasClass(className, el)) {
        return false
      }
    }
  }
  return true
}

const WEIGHT_IMPORTANT = 1000

function parseClassName(
  { styles, weights }: ParseStyleContext,
  parentStyles: Record<string, Record<string, unknown>>,
  el: UniXElement | null
) {
  each(parentStyles).forEach(parentSelector => {
    if (parentSelector && el) {
      if (!isMatchParentSelector(parentSelector, el)) {
        return
      }
    }
    const classWeight = parentSelector.split('.').length
    const style = parentStyles[parentSelector]
    each(style).forEach(name => {
      const value = style[name]
      const isImportant = name[0] === '!'
      if (isImportant) {
        name = name.slice(1)
      }
      const oldWeight = weights[name] || 0
      const weight = classWeight + (isImportant ? WEIGHT_IMPORTANT : 0)
      if (weight >= oldWeight) {
        weights[name] = weight
        styles.set(name, value)
      }
    })
  })
}

interface ParseStyleContext {
  styles: Map<string, unknown>
  weights: Record<string, number>
}

function parseClassListWithStyleSheet(
  classList: string[],
  stylesheet: NVueStyle | null,
  el: UniXElement | null = null
) {
  const context: ParseStyleContext = {
    styles: new Map(),
    weights: {}
  }
  classList.forEach(className => {
    const parentStyles = stylesheet && stylesheet[className]
    if (parentStyles) {
      parseClassName(context, parentStyles, el)
    }
  })
  return context
}

export function parseClassStyles(el: UniXElement) {
  const styles = getExtraStyles(el)
  return parseClassListWithStyleSheet(el.classList, styles, el)
}

export function parseClassList(
  classList: string[],
  instance: ComponentInternalInstance,
  el: UniXElement | null = null
) {
  return parseClassListWithStyleSheet(classList, parseStyleSheet(instance), el)
}

export function parseStyleSheet({
  type,
  appContext,
  root
}: ComponentInternalInstance) {
  const component = type as NVueComponent
  if (!component.__styles) {
    const __globalStyles = appContext.provides.__globalStyles
    // nvue 和 vue 混合开发时，__globalStyles注入的是未处理过的
    if (appContext && isArray(__globalStyles)) {
      appContext.provides.__globalStyles = useCssStyles(__globalStyles)
    }
    if (component.mpType === 'page' && appContext) {
      // 如果是页面组件，则直接使用全局样式
      component.__styles = __globalStyles
    } else {
      const styles: NVueStyle[] = []
      if (appContext && __globalStyles) {
        // 全局样式，包括 app.css 以及 page.css
        styles.push(__globalStyles)
      }
      // 合并页面样式
      // TODO 添加额外缓存
      const page = root.type as NVueComponent
      if (isArray(page.styles)) {
        styles.push(...page.styles)
      }
      if (isArray(component.styles)) {
        styles.push(...component.styles)
      }
      component.__styles = useCssStyles(styles)
    }
  }
  return component.__styles
}

export function extend<T>(
  a: Map<string, T>,
  b: Map<string, T>
): Map<string, T> {
  b.forEach((value, key) => {
    a.set(key, value)
  })
  return a
}

export function toStyle(
  el: UniXElement,
  classStyle: Map<string, any>,
  classStyleWeights: Record<string, number>
): Map<string, any> {
  const res = extend<any>(new Map<string, any>(), classStyle)
  const style = getExtraStyle(el)
  if (style != null) {
    style.forEach((value: any, key: string) => {
      const weight = classStyleWeights[key]
      // TODO: 目前只计算了 class 中 important 的权重，会存在 style class 同时设置 important 时，class 优先级更高的问题
      if (weight == null || weight < WEIGHT_IMPORTANT) {
        res.set(key, value)
      }
    })
  }

  return res
}
