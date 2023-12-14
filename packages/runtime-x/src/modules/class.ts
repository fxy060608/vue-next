import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import {
  parseClassStyles,
  parseStyleSheet,
  toStyle
} from '../helpers/useCssStyles'
import {
  getExtraClassStyle,
  isCommentNode,
  setExtraClassStyle,
  setExtraStyles
} from '../helpers/node'

export function patchClass(
  el: UniXElement,
  pre: string | null,
  next: string | null,
  instance: ComponentInternalInstance | null = null
) {
  if (!instance) {
    return
  }
  const classList = next ? next.split(' ') : []
  el.classList = classList
  setExtraStyles(el, parseStyleSheet(instance))
  // TODO 如果当前元素是组件根节点(非页面)
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
  const styles = toStyle(el, oldClassStyle, parseClassStylesResult.weights)
  if (styles.size == 0) {
    return
  }
  // TODO validateStyles
  // validateStyles(el, oldClassStyle)
  el.updateStyle(styles)
}
