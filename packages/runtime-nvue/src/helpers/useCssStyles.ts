import type { NVueElement } from '@dcloudio/uni-shared'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import { hasOwn, isArray } from '@vue/shared'

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

function hasClass(calssName: string, el: NVueElement | null) {
  const classList = el && el.classList
  return classList && classList.includes(calssName)
}

const TYPE_RE = /[+~> ]$/
const PROPERTY_PARENT_NODE = 'parentNode'
const PROPERTY_PREVIOUS_SIBLING = 'previousSibling'
function isMatchParentSelector(parentSelector: string, el: NVueElement | null) {
  const classArray = parentSelector.split('.')
  for (let i = classArray.length - 1; i > 0; i--) {
    const item = classArray[i]
    const type = item[item.length - 1]
    const className = item.replace(TYPE_RE, '')
    let property:
      | typeof PROPERTY_PARENT_NODE
      | typeof PROPERTY_PREVIOUS_SIBLING = PROPERTY_PARENT_NODE
    let recurse = true
    if (type === '>') {
      recurse = false
    } else if (type === '+') {
      property = PROPERTY_PREVIOUS_SIBLING
      recurse = false
    } else if (type === '~') {
      property = PROPERTY_PREVIOUS_SIBLING
    }
    if (recurse) {
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
      el = el && el[property]
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
  el: NVueElement | null
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
        styles[name] = value
      }
    })
  })
}

interface ParseStyleContext {
  styles: Record<string, unknown>
  weights: Record<string, number>
}

function parseClassListWithStyleSheet(
  classList: string[],
  stylesheet: NVueStyle,
  el: NVueElement | null = null
) {
  const context: ParseStyleContext = {
    styles: {},
    weights: {}
  }
  classList.forEach(className => {
    const parentStyles = stylesheet[className]
    if (parentStyles) {
      parseClassName(context, parentStyles, el)
    }
  })
  return context.styles
}

export function parseClassStyles(el: NVueElement) {
  return parseClassListWithStyleSheet(el.classList, el.styleSheet, el)
}

export function parseClassList(
  classList: string[],
  instance: ComponentInternalInstance,
  el: NVueElement | null = null
) {
  return parseClassListWithStyleSheet(classList, parseStyleSheet(instance), el)
}

export function parseStyleSheet({
  type,
  appContext
}: ComponentInternalInstance) {
  const component = type as NVueComponent
  if (!component.__styles) {
    if (component.mpType === 'page' && appContext) {
      // 如果是页面组件，则直接使用全局样式
      component.__styles = appContext.provides.__globalStyles
    } else {
      const styles: NVueStyle[] = []
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
