import { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

// 样式相关
const NODE_EXT_STYLES = 'styles' // node 中存储的可用样式表
const NODE_EXT_CLASS_STYLE = 'classStyle' // node 中存储的 classStyle
const NODE_EXT_STYLE = 'style' // node 中存储的 style

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

export function getExtraClassStyle(el: UniXElement): Map<string, any> | null {
  return getNodeExtraData(el, NODE_EXT_CLASS_STYLE) as Map<string, any> | null
}

export function setExtraClassStyle(
  el: UniXElement,
  classStyle: Map<string, any>
) {
  setNodeExtraData(el, NODE_EXT_CLASS_STYLE, classStyle)
}

export function getExtraStyle(el: UniXElement): Map<string, any> | null {
  return getNodeExtraData(el, NODE_EXT_STYLE) as Map<string, any> | null
}

export function setExtraStyle(el: UniXElement, style: Map<string, any>) {
  setNodeExtraData(el, NODE_EXT_STYLE, style)
}

export function isCommentNode(node: UniXElement): boolean {
  return node.nodeName == '#comment'
}
