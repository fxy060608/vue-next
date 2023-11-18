import type { NVueElement } from '@dcloudio/uni-shared'

import {
  camelize,
  isString,
  NormalizedStyle,
  parseStringStyle
} from '@vue/shared'

export function patchStyle(
  el: NVueElement,
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
  const batchedStyles: NormalizedStyle = {}
  const isPrevObj = prev && !isString(prev)
  if (isPrevObj) {
    for (const key in prev) {
      if (next[key] == null) {
        batchedStyles[camelize(key)] = ''
      }
    }
    for (const key in next) {
      const value = next[key]
      if (value !== prev[key]) {
        batchedStyles[camelize(key)] = value
      }
    }
  } else {
    for (const key in next) {
      batchedStyles[camelize(key)] = next[key]
    }
  }
  el.setStyles(batchedStyles)
}
