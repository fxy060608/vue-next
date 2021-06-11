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
    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (next[key] == null) {
          batchedStyles[key] = ''
        }
      }
    }
    for (const key in next) {
      batchedStyles[key] = next[key]
    }
    el.setAttribute('style', batchedStyles)
  }
}
