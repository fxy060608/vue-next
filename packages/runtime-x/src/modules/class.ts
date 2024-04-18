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
  isCommentNode,
  setExtraClassStyle,
  setExtraParentStyles,
  setExtraStyles,
} from '../helpers/node'

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
  // 如果当前元素是组件根节点(非页面)
  // todo 和安卓有差异 el === instance.subTree.el
  if (instance.parent != null && instance !== instance.root) {
    setExtraParentStyles(
      el,
      (instance.parent!.type as any).styles as NVueStyle[],
    )
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
  const styles = toStyle(el, oldClassStyle, parseClassStylesResult.weights)
  if (styles.size == 0) {
    return
  }
  // TODO validateStyles
  // validateStyles(el, oldClassStyle)
  el.updateStyle(styles)
}
