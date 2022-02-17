import type { NVueElement } from '@dcloudio/uni-shared'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import { isUndef, parseClassList } from '../helpers'

// compiler should normalize class + :class bindings on the same element
// into a single binding ['staticClass', dynamic]
export function patchClass(
  el: NVueElement,
  pre: string | null,
  next: string | null,
  instance: ComponentInternalInstance | null = null
) {
  // 移除 class
  if (next == null) {
    el.setClassList([])
    return
  }
  if (!instance) {
    return
  }
  const preClassList = pre ? pre.split(' ') : []
  const classList = next ? next.split(' ') : []
  const oldStyle = getStyle(preClassList, el, instance)
  const newStyle = getStyle(classList, el, instance)
  let cur, name
  const batchedStyles: Record<string, unknown> = {}
  for (name in oldStyle) {
    if (isUndef(newStyle[name])) {
      batchedStyles[name] = ''
    }
  }
  for (name in newStyle) {
    cur = newStyle[name]
    if (cur !== oldStyle[name]) {
      batchedStyles[name] = cur
    }
  }
  el.setClassList(classList)
  el.setStyles(batchedStyles)
}

function getStyle(
  classList: string[],
  el: NVueElement,
  instance: ComponentInternalInstance
) {
  return parseClassList(classList, instance, el)
}
