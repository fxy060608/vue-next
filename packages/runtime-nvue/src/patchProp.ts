import { NVueElement } from '@dcloudio/uni-shared'

import { RendererOptions } from '@vue/runtime-core'

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
) => {}
