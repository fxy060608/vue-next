import type { NVueElement } from '@dcloudio/uni-shared'

import { camelize, isString, NormalizedStyle } from '@vue/shared'

const listDelimiterRE = /;(?![^(]*\))/g
const propertyDelimiterRE = /:(.+)/

function parseStringStyle(cssText: string): NormalizedStyle {
  const ret: NormalizedStyle = {}
  cssText.split(listDelimiterRE).forEach(item => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE)
      tmp.length > 1 && (ret[camelize(tmp[0].trim())] = tmp[1].trim())
    }
  })
  return ret
}

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
        batchedStyles[key] = ''
      }
    }
    for (const key in next) {
      const value = next[key]
      if (value !== prev[key]) {
        batchedStyles[key] = value
      }
    }
  } else {
    for (const key in next) {
      batchedStyles[key] = next[key]
    }
  }
  el.setStyles(batchedStyles)
}
