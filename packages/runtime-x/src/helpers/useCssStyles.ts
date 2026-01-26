import type { UniElement as UniXElement } from '@dcloudio/uni-app-x/types/native'
import {
  type ComponentInternalInstance,
  UniSharedDataComponentStyleIsolation,
  __X_STYLE_ISOLATION__,
} from '@vue/runtime-core'
import { hasOwn, isArray } from '@vue/shared'
import {
  getExtraClassList,
  getExtraInstance,
  getExtraParentStyles,
  getExtraStyle,
  getExtraStyles,
} from './node'
import { getPartElementInstance, isCommentNode } from './node'

export type NVueStyle = Record<string, Record<string, Record<string, unknown>>>

interface NVueComponent {
  mpType: 'page' | 'app'
  styles: NVueStyle[]
  styleIsolation?: 'isolated' | 'app' | 'app-shared' | 'app-and-page'
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

function hasClass(
  className: string,
  el: UniXElement | null,
): [boolean, UniXElement | null] {
  if (!el) {
    return [false, null]
  }
  if (!className.endsWith(')')) {
    const classList = el && el.classList
    return [!!classList && classList.includes(className), el]
  }

  // ::part(xxx)
  // TODO part作为父选择器存在和class一样的问题，动态变化时不会影响子
  // TODO 返回最左选择器匹配到的元素的方式需要调整
  const partStart = className.lastIndexOf('::part(')
  const partName = className.slice(partStart + 7, className.length - 1)
  const part = el.getAnyAttribute('part')
  if (part == null || !part.split(' ').includes(partName)) {
    return [false, null]
  }
  const baseClassName = className.slice(0, partStart)
  const partInstance = getPartElementInstance(el)
  let hostEl = partInstance?.subTree.el as UniXElement | null
  if (hostEl == null) {
    return [false, null]
  }
  if (isCommentNode(hostEl)) {
    const instanceClass = partInstance?.attrs.class
    if (!instanceClass || typeof instanceClass !== 'string') {
      return [false, null]
    }
    const classList = (instanceClass as string).split(' ')
    if (!classList.includes(baseClassName)) {
      return [false, null]
    }
    return [true, hostEl]
  }
  const [matched, curEl] = hasClass(baseClassName, hostEl)
  if (!matched) {
    return [false, null]
  }
  return [true, curEl]
}

const TYPE_RE = /[+~> ]$/
const PROPERTY_PARENT_NODE = 'parentNode'
const PROPERTY_PREVIOUS_SIBLING = 'previousSibling'
export function isMatchParentSelector(
  parentSelector: string,
  el: UniXElement | null,
) {
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
        const [matched, curEl] = hasClass(className, el)
        if (matched) {
          el = curEl
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
      const [matched, curEl] = hasClass(className, el)
      if (!matched) {
        return false
      }
      el = curEl
    }
  }
  return true
}

const WEIGHT_IMPORTANT = 1000

function parseClassName(
  { styles, weights }: ParseStyleContext,
  parentStyles: Record<string, Record<string, unknown>>,
  el: UniXElement | null,
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
      const weight = classWeight + (isImportant ? WEIGHT_IMPORTANT : 0)
      const oldWeight = weights[name] || 0
      if (weight >= oldWeight) {
        weights[name] = weight
        styles.set(name, value)
      }
    })
  })
}

export class ParseStyleContext {
  styles: Map<string, unknown>
  weights: Record<string, number>

  constructor() {
    this.styles = new Map()
    this.weights = {}
  }
}

function parseClassListWithStyleSheet(
  classList: string[],
  stylesheet: NVueStyle | null,
  parentStylesheet: NVueStyle[] | null,
  el: UniXElement | null = null,
): ParseStyleContext {
  const context: ParseStyleContext = new ParseStyleContext()
  classList.forEach(className => {
    const style = stylesheet && stylesheet[className]
    if (style) {
      // TODO 待确认。自定义组件根节点也可以通过此分支访问父组件的样式？
      parseClassName(context, style, el)
    }

    // 自定义组件根节点class需要访问父组件的样式
    if (parentStylesheet != null) {
      parentStylesheet.forEach(style => {
        const parentStyle = style[className]
        if (parentStyle != null) {
          parseClassName(context, parentStyle, el)
        }
      })
    }
  })
  return context
}

export function parseClassStyles(el: UniXElement) {
  if (__X_STYLE_ISOLATION__) {
    return parseClassListWithCtx(
      getExtraClassList(el) ?? el.classList,
      getExtraInstance(el),
      el,
    )
  }
  const styles = getExtraStyles(el)
  const parentStyles = getExtraParentStyles(el)
  if ((styles == null && parentStyles == null) || el.classList.length == 0) {
    return new ParseStyleContext()
  }
  return parseClassListWithStyleSheet(el.classList, styles, parentStyles, el)
}

export function parseClassList(
  classList: string[],
  instance: ComponentInternalInstance,
  el: UniXElement | null = null,
) {
  return parseClassListWithStyleSheet(
    classList,
    parseStyleSheet(instance),
    null,
    el,
  ).styles
}

export function parseStyleSheet({
  type,
  appContext,
  root,
}: ComponentInternalInstance) {
  const component = type as NVueComponent
  const pageInstance = root as ComponentInternalInstance & {
    componentStylesCache?: Map<NVueComponent, NVueStyle>
  }
  if (!pageInstance.componentStylesCache) {
    pageInstance.componentStylesCache = new Map()
  }
  let cache = pageInstance.componentStylesCache.get(component)
  if (!cache) {
    const __globalStyles = appContext.provides.__globalStyles
    // nvue 和 vue 混合开发时，__globalStyles注入的是未处理过的
    if (appContext && isArray(__globalStyles)) {
      appContext.provides.__globalStyles = useCssStyles(__globalStyles)
    }
    const page = root.type as NVueComponent
    const isPage = component === page
    const styles: NVueStyle[] = []

    function addAppStyles() {
      if (appContext && __globalStyles) {
        // 全局样式，包括 app.css 以及 page.css
        const globalStyles = isArray(__globalStyles)
          ? __globalStyles
          : [__globalStyles]
        styles.push(...globalStyles)
      }
    }
    function addPageStyles() {
      if (!isPage && isArray(page.styles)) {
        styles.push(...page.styles)
      }
    }
    if (__X_STYLE_ISOLATION__) {
      let styleIsolation = isPage
        ? UniSharedDataComponentStyleIsolation.App
        : UniSharedDataComponentStyleIsolation.Isolated
      // 如果指定了正确的 styleIsolation，则覆盖默认值
      const styleIsolationStr = component.styleIsolation
      if (styleIsolationStr) {
        if (styleIsolationStr === 'isolated') {
          styleIsolation = UniSharedDataComponentStyleIsolation.Isolated
        } else if (
          styleIsolationStr === 'app' ||
          styleIsolationStr === 'app-shared'
        ) {
          styleIsolation = UniSharedDataComponentStyleIsolation.App
        } else if (styleIsolationStr === 'app-and-page') {
          styleIsolation = UniSharedDataComponentStyleIsolation.AppAndPage
        }
      }

      switch (styleIsolation) {
        case UniSharedDataComponentStyleIsolation.Isolated:
          // 不继承任何样式
          if (isArray(component.styles)) {
            styles.push(...component.styles)
          }
          break
        case UniSharedDataComponentStyleIsolation.App:
          addAppStyles()
          if (isArray(component.styles)) {
            styles.push(...component.styles)
          }
          break
        case UniSharedDataComponentStyleIsolation.AppAndPage:
          // 合并顺序：app -> component -> page
          addAppStyles()
          if (isArray(component.styles)) {
            styles.push(...component.styles)
          }
          addPageStyles()
          break
      }
    } else {
      addAppStyles()
      // 合并页面样式
      addPageStyles()
      if (isArray(component.styles)) {
        styles.push(...component.styles)
      }
    }
    cache = useCssStyles(styles)
    pageInstance.componentStylesCache.set(component, cache)
  }
  return cache
}

function extendMap<T>(a: Map<string, T>, b: Map<string, T>): Map<string, T> {
  b.forEach((value, key) => {
    a.set(key, value)
  })
  return a
}

export function toStyle(
  el: UniXElement,
  classStyle: Map<string, any>,
  classStyleWeights: Record<string, number>,
): Map<string, any> {
  // const res = extendMap<any>(new Map<string, any>(), classStyle)
  const style = getExtraStyle(el)
  // if (style != null) {
  //   style.forEach((value: any, key: string) => {
  //     const weight = classStyleWeights[key]
  //     // TODO: 目前只计算了 class 中 important 的权重，会存在 style class 同时设置 important 时，class 优先级更高的问题
  //     if (weight == null || weight < WEIGHT_IMPORTANT) {
  //       res.set(key, value)
  //     }
  //   })
  // }

  // return res
  return mergeClassStyles(classStyle, classStyleWeights, style)
}

export function mergeClassStyles(
  classStyle: Map<string, any>,
  classStyleWeights: Record<string, number>,
  style: Map<string, any> | null | undefined,
) {
  const res = extendMap<any>(new Map<string, any>(), classStyle)
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

/**
 * 根据当前组件实例解析 class 列表
 * @param classList
 * @param ctx
 * @param el
 * @returns
 */
export function parseClassListWithCtx(
  classList: string[],
  ctx: ComponentInternalInstance | null,
  el: UniXElement,
): ParseStyleContext {
  const context = new ParseStyleContext()
  if (classList.length == 0) {
    return context
  }
  if (ctx == null) {
    console.warn('parseClass context is null')
    return context
  }
  classList.forEach(className => {
    if (className.length == 0) {
      return
    }
    let currentCtx: ComponentInternalInstance | null = null
    if (className.charAt(0) != '^') {
      currentCtx = ctx
    } else {
      currentCtx = ctx.hostInstance
      if (currentCtx != null) {
        let parentLevel = 0
        while (className.charAt(parentLevel) == '^') {
          parentLevel++
        }
        if (parentLevel > 0) {
          className = className.slice(parentLevel)
          if (className.length == 0) {
            if (__DEV__) {
              console.warn(`Invalid class name: only contains '^' characters`)
            }
            return
          }

          for (let i = 1; i < parentLevel; i++) {
            if (currentCtx == null) {
              break
            }
            currentCtx =
              currentCtx.hostInstance as ComponentInternalInstance | null
          }
        }
      }
    }

    if (currentCtx != null) {
      const parentStyles = parseStyleSheet(currentCtx!)[className]
      if (parentStyles != null) {
        parseClassName(context, parentStyles, el)
      }
    }
  })
  return context
}
