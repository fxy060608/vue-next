import { UniNode, UniElement } from '@dcloudio/uni-shared'

import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchAttr } from './modules/attrs'

import { patchEvent } from './modules/events'
import { isOn } from '@vue/shared'
import { RendererOptions } from '@vue/runtime-core'

type DOMRendererOptions = RendererOptions<UniNode, UniElement>

export const forcePatchProp: DOMRendererOptions['forcePatchProp'] = (_, key) =>
  key === 'value'

export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
  parentComponent
) => {
  switch (key) {
    // special
    case 'class':
      patchClass(el, nextValue)
      break
    case 'style':
      patchStyle(el, prevValue, nextValue)
      break
    case 'modelValue':
    case 'onUpdate:modelValue':
      // handled by v-model directive
      break
    default:
      if (isOn(key)) {
        patchEvent(el, key, prevValue, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }
      break
  }
}
