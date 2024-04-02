import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

// 样式相关
const NODE_EXT_STYLES = 'styles' // node 中存储的可用样式表
const NODE_EXT_CLASS_STYLE = 'classStyle' // node 中存储的 classStyle
const NODE_EXT_STYLE = 'style' // node 中存储的 style

// Text Node 相关
const NODE_EXT_IS_TEXT_NODE = 'isTextNode'
const NODE_EXT_CHILD_NODE = 'childNode'
const NODE_EXT_PARENT_NODE = 'parentNode'
const NODE_EXT_CHILD_NODES = 'childNodes'

function setNodeExtraData(el: UniXElement, name: string, value: any | null) {
  el.ext.set(name, value)
}

export function getNodeExtraData(el: UniXElement, name: string): any | null {
  return el.ext.get(name)
}

export function getExtraStyles(
  el: UniXElement,
): Record<string, Record<string, Record<string, unknown>>> | null {
  return getNodeExtraData(el, NODE_EXT_STYLES) as Record<
    string,
    Record<string, Record<string, unknown>>
  > | null
}

export function setExtraStyles(
  el: UniXElement,
  styles: Record<string, Record<string, Record<string, any>>>,
) {
  setNodeExtraData(el, NODE_EXT_STYLES, styles)
}

export function getExtraClassStyle(el: UniXElement): Map<string, any> | null {
  return getNodeExtraData(el, NODE_EXT_CLASS_STYLE) as Map<string, any> | null
}

export function setExtraClassStyle(
  el: UniXElement,
  classStyle: Map<string, any>,
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

export function isExtraTextNode(el: UniXElement): boolean {
  return getNodeExtraData(el, NODE_EXT_IS_TEXT_NODE) === true
}

export function setExtraIsTextNode(el: UniXElement, isTextNode: boolean) {
  setNodeExtraData(el, NODE_EXT_IS_TEXT_NODE, isTextNode)
}

export function isTextElement(value: any | null): boolean {
  // @ts-expect-error
  return value instanceof UniTextElement
}

export function getExtraChildNode(el: UniXElement): Element | null {
  return getNodeExtraData(el, NODE_EXT_CHILD_NODE) as Element | null
}

export function setExtraChildNode(el: UniXElement, childNode: UniXElement) {
  setNodeExtraData(el, NODE_EXT_CHILD_NODE, childNode)
}

export function setExtraParentNode(el: UniXElement, parentNode: UniXElement) {
  setNodeExtraData(el, NODE_EXT_PARENT_NODE, parentNode)
}

export function getExtraChildNodes(el: UniXElement): UniXElement[] | null {
  return getNodeExtraData(el, NODE_EXT_CHILD_NODES) as UniXElement[] | null
}

export function setExtraChildNodes(el: UniXElement, childNodes: UniXElement[]) {
  setNodeExtraData(el, NODE_EXT_CHILD_NODES, childNodes)
}

export function getExtraParentNode(el: UniXElement): UniXElement | null {
  return getNodeExtraData(el, NODE_EXT_PARENT_NODE) as UniXElement | null
}
