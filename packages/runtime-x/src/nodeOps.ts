import {
  Element as UniXElement,
  IPage,
  IDocument
} from '@dcloudio/uni-app-x/types/native'

import { RendererOptions } from '@vue/runtime-core'

let rootPage: IPage | null = null
let rootDocument: IDocument | null = null
export function getDocument() {
  if (!rootPage) {
    rootPage = __pageManager.createPage('', '', new Map())
  }
  if (!rootDocument) {
    rootDocument = rootPage.document
  }
  return rootDocument
}

export const nodeOps: Omit<
  RendererOptions<UniXElement, UniXElement>,
  'patchProp'
> = {
  insert: (child, parent, anchor) => {
    if (!anchor) {
      return parent.appendChild(child)
    }
    return parent.insertBefore(child, anchor)
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  createElement: (tag, container): UniXElement => {
    return getDocument().createElement(tag)
  },
  createText: (text, container) => {
    const textNode = getDocument().createElement(text)
    textNode.setAttribute('value', text)
    return textNode
  },
  createComment: (text, container) => {
    return getDocument().createComment(text)
  },
  setText: (node, text) => {
    node.setAttribute('value', text)
  },
  setElementText: (el, text) => {
    el.setAttribute('value', text)
  },
  parentNode: node => node.parentNode as UniXElement | null,
  nextSibling: node => node.nextSibling
}
