import type { NVueElement } from '@dcloudio/uni-shared'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import { extend } from '@vue/shared'
import { isUndef, parseStylesheet } from '../helpers'

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
    return
  }
  if (!instance) {
    return
  }
  const oldStyle = getStyle(pre, instance)
  const newStyle = getStyle(next, instance)
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
  el.setStyles(batchedStyles)
}

function getStyle(clazz: string | null, instance: ComponentInternalInstance) {
  if (!clazz) {
    return {}
  }
  const classList = clazz.split(' ')
  const stylesheet = parseStylesheet(instance)
  const result: Record<string, unknown> = {}
  classList.forEach(name => {
    const style = stylesheet[name]
    extend(result, style)
  })
  return result
}
