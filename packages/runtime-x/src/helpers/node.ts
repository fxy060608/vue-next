import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

// 样式相关
const NODE_EXT_STYLES = 'styles' // node 中存储的可用样式表

function setNodeExtraData(el: UniXElement, name: string, value: any | null) {
  el.ext.set(name, value)
}

export function getNodeExtraData(el: UniXElement, name: string): any | null {
  return el.ext.get(name)
}

export function getExtraStyles(
  el: UniXElement
): Record<string, Record<string, Record<string, unknown>>> | null {
  return getNodeExtraData(el, NODE_EXT_STYLES) as Record<
    string,
    Record<string, Record<string, unknown>>
  > | null
}

export function setExtraStyles(
  el: UniXElement,
  styles: Record<string, Record<string, Record<string, any>>>
) {
  setNodeExtraData(el, NODE_EXT_STYLES, styles)
}
