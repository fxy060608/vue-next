import { UniElement } from '@dcloudio/uni-shared'

export function patchAttr(el: UniElement, key: string, value: any) {
  if (value == null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
