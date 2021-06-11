import { UniElement } from '@dcloudio/uni-shared'
import { ObjectDirective } from '@vue/runtime-core'

interface VShowElement extends UniElement {
  // _vod = vue original display
  _vod: string
}

export const vShow: ObjectDirective<VShowElement> = {
  beforeMount(el, { value }) {
    el._vod = (el.style.display === 'none' ? '' : el.style.display) as string
    setDisplay(el, value)
  },
  updated(el, { value, oldValue }) {
    if (!value === !oldValue) return
    setDisplay(el, value)
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value)
  }
}

function setDisplay(el: VShowElement, value: unknown): void {
  el.style.display = value ? el._vod : 'none'
}
