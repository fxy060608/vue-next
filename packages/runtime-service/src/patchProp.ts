import { JSON_PROTOCOL, UniNode, UniElement } from '@dcloudio/uni-shared'
import { isModelListener, isObject, isOn } from '@vue/shared'
import { RendererOptions } from '@vue/runtime-core'

import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchAttr } from './modules/attrs'

import { patchEvent } from './modules/events'

type DOMRendererOptions = RendererOptions<UniNode, UniElement>

const forcePatchProps = {
  AD: ['data'],
  'AD-DRAW': ['data'],
  'LIVE-PLAYER': ['picture-in-picture-mode'],
  MAP: [
    'markers',
    'polyline',
    'circles',
    'controls',
    'include-points',
    'polygons'
  ],
  PICKER: ['range', 'value'],
  'PICKER-VIEW': ['value'],
  'RICH-TEXT': ['nodes'],
  VIDEO: ['danmu-list', 'header'],
  'WEB-VIEW': ['webview-styles']
}

const forcePatchPropKeys = ['animation']

export const forcePatchProp: DOMRendererOptions['forcePatchProp'] = (
  _,
  key
) => {
  if (forcePatchPropKeys.indexOf(key) > -1) {
    return true
  }
  const keys = forcePatchProps[_.nodeName as keyof typeof forcePatchProps]
  if (keys && keys.indexOf(key) > -1) {
    return true
  }
  return false
}

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
          patchEvent(el, key, prevValue, nextValue, parentComponent)
        }
      } else {
        // 非基本类型
        if (isObject(nextValue)) {
          const equal = prevValue === nextValue
          // 可触发收集响应式数据的最新依赖
          nextValue = JSON_PROTOCOL + JSON.stringify(nextValue)
          if (equal && el.getAttribute(key) === nextValue) {
            return
          }
        } else if (prevValue === nextValue) {
          // 基本类型
          return
        }
        patchAttr(el, key, nextValue)
      }
      break
  }
}
