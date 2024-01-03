import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

import {
  camelize,
  isString,
  NormalizedStyle,
  parseStringStyle
} from '@vue/shared'
import { setExtraStyle } from '../helpers/node'

export function patchStyle(
  el: UniXElement,
  prev: NormalizedStyle | string,
  next: NormalizedStyle | string
) {
  if (!next) {
    // TODO remove styles
    // el.setStyles({})
    return
  }
  if (isString(next)) {
    next = parseStringStyle(next)
  }
  const batchedStyles = new Map<
    keyof NormalizedStyle,
    NormalizedStyle[keyof NormalizedStyle]
  >()
  const isPrevObj = prev && !isString(prev)
  if (isPrevObj) {
    for (const key in prev) {
      if (next[key] == null) {
        batchedStyles.set(camelize(key), '')
      }
    }
    for (const key in next) {
      const value = next[key]
      if (value !== prev[key]) {
        batchedStyles.set(camelize(key), value)
      }
    }
  } else {
    for (const key in next) {
      batchedStyles.set(camelize(key), next[key])
    }
    setExtraStyle(el, batchedStyles)
  }
  // TODO validateStyles(el, batchedStyles)
  el.updateStyle(batchedStyles)
}
