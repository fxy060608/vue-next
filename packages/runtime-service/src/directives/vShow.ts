import { UniElement } from '@dcloudio/uni-shared'
import { ObjectDirective } from '@vue/runtime-core'

export const vShow: ObjectDirective<UniElement> = {
  beforeMount(el, { value }) {
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

function setDisplay(el: UniElement, value: unknown): void {
  el.setAttribute('.vShow', !!value)
}
