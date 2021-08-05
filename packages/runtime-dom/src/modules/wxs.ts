import { ComponentInternalInstance, nextTick } from '@vue/runtime-core'
interface WXSElement {
  __wxsWatches?: { [name: string]: () => void }
}
export function patchWxs(
  el: Element & WXSElement,
  rawName: string,
  nextValue: Function | null,
  instance: ComponentInternalInstance | null = null
) {
  if (!el.__wxsWatches) {
    el.__wxsWatches = {}
  }
  if (!nextValue) {
    return el.__wxsWatches[rawName] && el.__wxsWatches[rawName]()
  }
  if (!el.__wxsWatches[rawName] && instance && instance.proxy) {
    const proxy = instance.proxy
    const name = rawName.split(':')[1]
    el.__wxsWatches[rawName] = proxy.$watch(
      () => instance.attrs[name],
      (value: unknown, oldValue: unknown) => {
        nextTick(() => {
          nextValue(
            value,
            oldValue,
            (proxy as any).$gcd(proxy, true),
            (proxy as any).$gcd(proxy, false)
          )
        })
      },
      {
        deep: true
      }
    )
  }
}
