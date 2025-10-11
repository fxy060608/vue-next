import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import {
  type NVueStyle,
  parseClassStyles,
  parseStyleSheet,
  toStyle,
} from '../helpers/useCssStyles'
import {
  getExtraClassStyle,
  getRootElementInstance,
  isCommentNode,
  setExtraClassStyle,
  setExtraParentStyles,
  setExtraStyles,
  setRootElementInstance,
} from '../helpers/node'
import type { VShowElement } from '../directives/vShow'
import {
  collectClassStyles,
  triggerComputedStyleUpdate,
} from '../helpers/useComputedStyle'

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
  el.classList = classList
  setExtraStyles(el, parseStyleSheet(instance))
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
    setExtraParentStyles(
      el,
      (instance.parent!.type as any).styles as NVueStyle[],
    )
    setRootElementInstance(el, instance)
  }
  updateClassStyles(el)
}

export function updateClassStyles(el: UniXElement) {
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
  const parseClassStylesResult = parseClassStyles(el)
  parseClassStylesResult.styles.forEach((value: any, key: string) => {
    oldClassStyle.set(key, value)
  })
  const instance = getRootElementInstance(el)
  if (instance && instance.computedStyleInterceptors) {
    collectClassStyles(
      instance,
      parseClassStylesResult.vueComputedStyles,
      parseClassStylesResult.vueComputedStyleWeights,
    )
    triggerComputedStyleUpdate(instance)
  }
  const styles = toStyle(el, oldClassStyle, parseClassStylesResult.weights)
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
