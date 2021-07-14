import { UniNode, UniElement } from '@dcloudio/uni-shared'

import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchAttr } from './modules/attrs'

import { patchEvent } from './modules/events'
import { isModelListener, isOn } from '@vue/shared'
import { RendererOptions } from '@vue/runtime-core'

type DOMRendererOptions = RendererOptions<UniNode, UniElement>

// fixed by xxxxxx 不强制更新value，否则即使不变，也会从 service 同步到 view 中
export const forcePatchProp: DOMRendererOptions['forcePatchProp'] = (_, key) =>
  false // key === 'value'

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
    default:
      if (isOn(key)) {
        // ignore v-model listeners
        if (!isModelListener(key)) {
          patchEvent(el, key, prevValue, nextValue)
        }
      } else {
        patchAttr(el, key, nextValue)
      }
      break
  }
}
