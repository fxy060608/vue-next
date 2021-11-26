import { NVueDocument, NVueElement, NVueTextNode } from '@dcloudio/uni-shared'

import { RendererOptions } from '@vue/runtime-core'

declare var document: NVueDocument

export const nodeOps: Omit<
  RendererOptions<NVueElement, NVueElement>,
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
  createElement: (tag): NVueElement => {
    return document.createElement(tag)
  },
  createText: text => new NVueTextNode(text) as unknown as NVueElement,
  createComment: text => document.createComment(text) as unknown as NVueElement,
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (el, text) => {
    if (el.parentNode) {
      el.parentNode.setAttr('value', text)
    }
  },
  parentNode: node => node.parentNode,
  nextSibling: node => node.nextSibling
}
