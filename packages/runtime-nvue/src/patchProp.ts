import { NVueElement } from '@dcloudio/uni-shared'

import { RendererOptions } from '@vue/runtime-core'
import { isModelListener, isOn } from '@vue/shared'
import { patchAttr } from './modules/attrs'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/events'
import { patchStyle } from './modules/style'

type DOMRendererOptions = RendererOptions<NVueElement, NVueElement>

export { forcePatchProp } from '@dcloudio/uni-shared'

export const patchProp: DOMRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
  isSVG = false,
  prevChildren,
  parentComponent,
  parentSuspense,
  unmountChildren
) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
    // ignore v-model listeners
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent)
    }
  } else {
    patchAttr(el, key, nextValue)
  }
}
