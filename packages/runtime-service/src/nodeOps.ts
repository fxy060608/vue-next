import { UniNode, UniElement } from '@dcloudio/uni-shared'

import { RendererOptions } from '@vue/runtime-core'
import { createComment, createElement, createTextNode } from './dom'

let tempContainer: UniElement

export const nodeOps: Omit<
  RendererOptions<UniNode, UniElement>,
  'patchProp'
> = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },

  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  createElement: (tag, container): UniElement => {
    return createElement(tag, container as UniElement)
  },

  createText: (text, container) =>
    createTextNode(text, container as UniElement),

  createComment: (text, container) =>
    createComment(text, container as UniElement),

  setText: (node, text) => {
    node.nodeValue = text
  },

  setElementText: (el, text) => {
    el.textContent = text
  },

  parentNode: node => node.parentNode as UniElement | null,

  nextSibling: node => node.nextSibling,

  // querySelector: selector => doc.querySelector(selector),

  setScopeId(el, id) {
    el.setAttribute(id, '')
  },

  cloneNode(el) {
    const cloned = el.cloneNode(true)
    // #3072
    // - in `patchDOMProp`, we store the actual value in the `el._value` property.
    // - normally, elements using `:value` bindings will not be hoisted, but if
    //   the bound value is a constant, e.g. `:value="true"` - they do get
    //   hoisted.
    // - in production, hoisted nodes are cloned when subsequent inserts, but
    //   cloneNode() does not copy the custom property we attached.
    // - This may need to account for other custom DOM properties we attach to
    //   elements in addition to `_value` in the future.
    if (`_value` in el) {
      ;(cloned as any)._value = (el as any)._value
    }
    return cloned
  },

  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor) {
    const temp = tempContainer || (tempContainer = createElement('div'))
    temp.innerHTML = content
    const first = temp.firstChild as UniElement
    let node: UniElement | null = first
    let last: UniElement = node
    while (node) {
      last = node
      nodeOps.insert(node, parent, anchor)
      node = temp.firstChild as UniElement
    }
    return [first, last]
  }
}
