import { UniElement } from '@dcloudio/uni-shared'

import { isString } from '@vue/shared'

type Style = string | Record<string, string | string[]> | null

export function patchStyle(el: UniElement, prev: Style, next: Style) {
  if (!next) {
    el.removeAttribute('style')
  } else if (isString(next)) {
    if (prev !== next) {
      el.setAttribute('style', next)
    }
  } else {
    const batchedStyles: Record<string, string | string[]> = {}
    const isPrevObj = prev && !isString(prev)
    if (isPrevObj) {
      for (const key in prev as Record<string, string | string[]>) {
        if (next[key] == null) {
          batchedStyles[key] = ''
        }
      }
      for (const key in next) {
        const value = next[key]
        if (value !== (prev as Record<string, string | string[]>)[key]) {
          batchedStyles[key] = value
        }
      }
    } else {
      for (const key in next) {
        batchedStyles[key] = next[key]
      }
    }
    if (Object.keys(batchedStyles).length) {
      el.setAttribute('style', batchedStyles)
    }
  }
}
