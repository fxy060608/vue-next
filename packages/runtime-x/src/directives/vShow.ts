import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import { ObjectDirective } from '@vue/runtime-core'

export const vShow: ObjectDirective<UniXElement> = {
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

function setDisplay(el: UniXElement, value: unknown): void {
  el.setAnyAttribute('.vShow', !!value)
}
