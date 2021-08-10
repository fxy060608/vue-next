import { ComponentInternalInstance, nextTick } from '@vue/runtime-core'
interface WXSElement {
  __wxsProps?: { [name: string]: unknown }
}
export function patchWxs(
  el: Element & WXSElement,
  rawName: string,
  nextValue: Function | null,
  instance: ComponentInternalInstance | null = null
) {
  if (!nextValue || !instance) {
    return
  }
  const propName = rawName.replace('change:', '')
  const { attrs } = instance
  const nextPropValue = attrs[propName]
  const prevPropValue = (el.__wxsProps || (el.__wxsProps = {}))[propName]
  if (prevPropValue === nextPropValue) {
    return
  }
  el.__wxsProps[propName] = nextPropValue
  const proxy = instance.proxy!
  nextTick(() => {
    nextValue(
      nextPropValue,
      prevPropValue,
      (proxy as any).$gcd(proxy, true),
      (proxy as any).$gcd(proxy, false)
    )
  })
}
