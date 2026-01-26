import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import {
  type ComponentInternalInstance,
  __X_STYLE_ISOLATION__,
} from '@vue/runtime-core'
import {
  type NVueStyle,
  ParseStyleContext,
  parseClassStyles,
  parseStyleSheet,
  toStyle,
} from '../helpers/useCssStyles'
import {
  getExtraClassStyle,
  getRootElementInstance,
  isCommentNode,
  setExtraClassList,
  setExtraClassStyle,
  setExtraInstance,
  setExtraParentStyles,
  setExtraStyles,
  setRootElementInstance,
} from '../helpers/node'
import type { VShowElement } from '../directives/vShow'
import { triggerComputedStyleUpdate } from '../helpers/useComputedStyle'
import { getPartElementContext } from './part'

const ElementClassContextMap = new WeakMap<UniXElement, ParseStyleContext>()
export function setElementClassContext(
  el: UniXElement,
  context: ParseStyleContext,
) {
  ElementClassContextMap.set(el, context)
}

export function getElementClassContext(
  el: UniXElement,
): ParseStyleContext | null {
  return ElementClassContextMap.get(el) || null
}

export function patchClass(
  el: UniXElement,
  pre: string | null,
  next: string | null,
  instance: ComponentInternalInstance | null = null,
) {
  if (!instance) {
    return
  }
  const classList = next ? next.split(' ') : []
  if (__X_STYLE_ISOLATION__) {
    setExtraClassList(el, classList)
    // 移除表达样式穿透的^标识，仅启用样式隔离时需要
    // 预检：绝大多数情况下没有^标识，避免不必要的数组创建
    const hasCaretPrefix = classList.some(c => c.charCodeAt(0) == 94)
    el.classList = hasCaretPrefix ? normalizeClassList(classList) : classList
  } else {
    el.classList = classList
  }
  if (__X_STYLE_ISOLATION__) {
    setExtraInstance(el, instance)
  } else {
    setExtraStyles(el, parseStyleSheet(instance))
  }
  // 如果当前元素是组件根节点(非页面)，重要：仅限根元素。
  // 组件根元素需要存储父组件的样式表，当解析根元素样式时，需要读取父组件的样式表，确保父组件给子组件根元素加的class生效
  // https://github.com/fxy060608/vue-next/blob/1f3b2b8397b2a6439d9ad00b7551ad42fb4b9c3e/packages/runtime-x/src/helpers/useCssStyles.ts#L162
  // 即：<template><child class="class-in-parent"></template><style>.class-in-parent { color: red; }</style>
  // 此时 class-in-parent 的样式需要确保应用到 child 的根节点上
  if (
    instance.parent != null &&
    instance !== instance.root &&
    el === instance.subTree.el
  ) {
    if (!__X_STYLE_ISOLATION__) {
      setExtraParentStyles(
        el,
        (instance.parent!.type as any).styles as NVueStyle[],
      )
    }
    setRootElementInstance(el, instance)
  }
  updateClassStyles(el)
}

export function updateClassStyles(el: UniXElement) {
  const parseClassStylesResult = parseClassStyles(el)
  setElementClassContext(el, parseClassStylesResult)
  mergeAndUpdateClassStyles(el)
}

export function mergeAndUpdateClassStyles(el: UniXElement) {
  if (el.parentNode == null || isCommentNode(el)) {
    return
  }
  if (getExtraClassStyle(el) == null) {
    setExtraClassStyle(el, new Map<string, any>())
  }
  const oldClassStyle = getExtraClassStyle(el) as Map<string, any>
  // reset previous class style to empty string
  oldClassStyle.forEach((_value: any, key: string) => {
    oldClassStyle.set(key, '')
  })
  const elementClassContext = getElementClassContext(el)
  const partStyleContext = getPartElementContext(el)
  let mergedStyleContext: ParseStyleContext | null = null
  if (elementClassContext && partStyleContext) {
    mergedStyleContext = new ParseStyleContext()
    // 合并 styles 和 weights
    elementClassContext.styles.forEach((value: any, key: string) => {
      mergedStyleContext!.styles.set(key, value)
      mergedStyleContext!.weights[key] = elementClassContext.weights[key]
    })
    partStyleContext.styles.forEach((value: any, key: string) => {
      const weight = partStyleContext.weights[key]
      const oldWeight = mergedStyleContext!.weights[key] ?? 0
      // 同权重时组件内部样式优先级更高
      if (weight > oldWeight) {
        mergedStyleContext!.weights[key] = weight
        mergedStyleContext!.styles.set(key, partStyleContext.styles.get(key)!)
      }
    })
  } else if (elementClassContext) {
    mergedStyleContext = elementClassContext
  } else if (partStyleContext) {
    mergedStyleContext = partStyleContext
  }
  if (mergedStyleContext == null) {
    return
  }
  mergedStyleContext.styles.forEach((value: any, key: string) => {
    oldClassStyle.set(key, value)
  })
  const styles = toStyle(el, oldClassStyle, mergedStyleContext.weights)
  const instance = getRootElementInstance(el)
  if (instance && instance.computedStyleInterceptors) {
    triggerComputedStyleUpdate(instance, styles)
  }
  if (styles.size == 0) {
    return
  }
  // TODO validateStyles
  // validateStyles(el, oldClassStyle)
  if ((el as VShowElement)._vsh) {
    styles.set('display', 'none')
  }
  el.updateStyle(styles)
}

/**
 * 移除 classList 中表达样式穿透的^标识（字符串起始，支持多个），需要去重
 * 注意：调用此函数前应先确认 classList 中确实包含 ^ 标识
 * @param classList
 */
function normalizeClassList(classList: string[]): string[] {
  const len = classList.length

  // 快速路径：单个 class 直接处理，无需 Set
  // 由于外层已预检，len == 1 时必然包含 ^
  if (len == 1) {
    const className = classList[0]
    let start = 1
    while (start < className.length && className.charCodeAt(start) == 94) {
      start++
    }
    return [className.slice(start)]
  }

  const seen = new Set<string>()
  for (let i = 0; i < len; i++) {
    const className = classList[i]
    if (className.charCodeAt(0) == 94 /* ^ */) {
      let start = 1
      while (start < className.length && className.charCodeAt(start) == 94) {
        start++
      }
      seen.add(className.slice(start))
    } else {
      seen.add(className)
    }
  }
  return Array.from(seen)
}
