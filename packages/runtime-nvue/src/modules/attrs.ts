import type { NVueElement } from '@dcloudio/uni-shared'

export function patchAttr(el: NVueElement, key: string, value: any) {
  if (value == null) {
    // TODO remove
  } else {
    el.setAttr(key, value)
  }
}
