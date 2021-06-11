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
  created(el, { modifiers: { lazy, trim, number } }, vnode) {
    el._assign = getModelAssigner(vnode)
    addEventListener(el, lazy ? 'change' : 'input', e => {
      let domValue: string | number = el.value as string
      if (trim) {
        domValue = domValue.trim()
      } else if (number) {
        domValue = toNumber(domValue)
      }
      el._assign(domValue)
    })
    if (trim) {
      addEventListener(el, 'change', () => {
        el.value = (el.value as string).trim()
      })
    }
    if (!lazy) {
      addEventListener(el, 'change', evt => el.dispatchEvent(evt))
    }
  },
  beforeUpdate(el, { value }, vnode) {
    el._assign = getModelAssigner(vnode)
    const newValue = value == null ? '' : value
    if (el.value !== newValue) {
      el.value = newValue
    }
  }
}
