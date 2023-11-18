import type { UniNode, UniElement } from '@dcloudio/uni-shared'

import { RendererOptions } from '@vue/runtime-core'

export const nodeOps: Omit<
  RendererOptions<UniNode, UniElement>,
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
  // @ts-expect-error
  createElement: (tag, container): UniElement => {
    // TODO
  },
  // @ts-expect-error
  createText: (text, container) => {
    // TODO
  },
  // @ts-expect-error
  createComment: (text, container) => {
    // TODO
  },
  setText: (node, text) => {
    // TODO
  },
  setElementText: (el, text) => {
    // TODO
  },
  parentNode: node => node.parentNode as UniElement | null,
  nextSibling: node => node.nextSibling
}
