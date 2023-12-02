import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

import { RendererOptions } from '@vue/runtime-core'
import { isModelListener, isOn } from '@vue/shared'
import { patchAttr } from './modules/attrs'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/events'
import { patchStyle } from './modules/style'

type DOMRendererOptions = RendererOptions<UniXElement, UniXElement>

// TODO remove
export { forcePatchProp } from '@dcloudio/uni-shared'

const vModelTags = ['u-input', 'u-textarea']

export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
  isSVG = false,
  prevChildren,
  parentComponent,
  parentSuspense,
  unmountChildren,
  hostInstance
) => {
  if (key === 'class') {
    patchClass(el, prevValue, nextValue, hostInstance || parentComponent)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    // ignore v-model listeners
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent)
    }
  } else if (
    key === 'modelValue' &&
    vModelTags.includes(el.tagName.toLocaleLowerCase())
  ) {
    // v-model 时，原生 input 和 textarea 接收的是 value
    el.setAnyAttribute('modelValue', nextValue)
    el.setAnyAttribute('value', nextValue)
  } else {
    patchAttr(el, key, nextValue, parentComponent)
  }
}
