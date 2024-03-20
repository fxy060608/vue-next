import type { ObjectDirective, VNode } from '@vue/runtime-core'
import { invokeArrayFns, isArray } from '@vue/shared'
import type {
  Element as UniXElement,
  InputEvent as UniXInputEvent,
} from '@dcloudio/uni-app-x/types/native'

type AssignerFn = (value: any) => void

const getModelAssigner = (vnode: VNode): AssignerFn => {
  const fn = vnode.props!['onUpdate:modelValue']
  return isArray(fn) ? value => invokeArrayFns(fn, value) : fn
}

export const vModelText: ObjectDirective = {
  created(el: UniXElement, _binding, _vnode, _prevVNode) {
    const trigger = getModelAssigner(_vnode)
    el.addEventListener('input', (event: UniXInputEvent) => {
      trigger(event.detail.value)
    })
  },
  mounted(el, _binding, _vnode, _prevVNode) {
    el.setAnyAttribute('value', _binding.value ?? '')
  },
  beforeUpdate(el, _binding, _vnode, _prevVNode) {
    el.setAnyAttribute('value', _binding.value ?? '')
  },
}
