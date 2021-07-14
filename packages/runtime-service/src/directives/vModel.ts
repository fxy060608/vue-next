import { UniInputElement, UniTextAreaElement } from '@dcloudio/uni-shared'

import { ObjectDirective, VNode } from '@vue/runtime-core'
import { addEventListener } from '../modules/events'
import { isArray, invokeArrayFns, toNumber } from '@vue/shared'

type AssignerFn = (value: any) => void

const getModelAssigner = (vnode: VNode): AssignerFn => {
  const fn = vnode.props!['onUpdate:modelValue']
  return isArray(fn) ? value => invokeArrayFns(fn, value) : fn
}

type ModelDirective<T> = ObjectDirective<T & { _assign: AssignerFn }>

// We are exporting the v-model runtime directly as vnode hooks so that it can
// be tree-shaken in case v-model is never used.
export const vModelText: ModelDirective<
  UniInputElement | UniTextAreaElement
> = {
  created(el, { modifiers: { trim, number } }, vnode) {
    el._assign = getModelAssigner(vnode)
    addEventListener(el, 'input', e => {
      let domValue: string | number = e.detail.value as string
      // 从 view 层接收到新值后，赋值给 service 层元素，注意，需要临时解除 pageNode，否则赋值 value 会触发向 view 层的再次同步数据
      const pageNode = el.pageNode
      el.pageNode = null
      el.value = domValue
      el.pageNode = pageNode
      if (trim) {
        domValue = domValue.trim()
      } else if (number) {
        domValue = toNumber(domValue)
      }
      el._assign(domValue)
    })
  },
  beforeUpdate(el, { value }, vnode) {
    el._assign = getModelAssigner(vnode)
    const newValue = value == null ? '' : value
    if (el.value !== newValue) {
      el.value = newValue
    }
  }
}
