import { ObjectDirective, VNode } from '@vue/runtime-core'
import { isArray, invokeArrayFns } from '@vue/shared'

type AssignerFn = (value: any) => void

const getModelAssigner = (vnode: VNode): AssignerFn => {
  const fn = vnode.props!['onUpdate:modelValue']
  return isArray(fn) ? value => invokeArrayFns(fn, value) : fn
}

export const vModelText: ObjectDirective = {
  created(el, _binding, _vnode, _prevVNode) {
    const trigger = getModelAssigner(_vnode)
    el.addEventListener('input', (_: any) => {
      trigger(el.getAnyAttribute('value')!)
    })
  },
  mounted(el, _binding, _vnode, _prevVNode) {
    el.setAnyAttribute('value', _binding.value ?? '')
  },
  beforeUpdate(el, _binding, _vnode, _prevVNode) {
    el.setAnyAttribute('value', _binding.value ?? '')
  }
}
