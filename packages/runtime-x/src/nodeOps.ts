import type {
  IDocument as UniXDocument,
  Element as UniXElement,
} from '@dcloudio/uni-app-x/types/native'

import type { RendererOptions } from '@vue/runtime-core'
import { updateClassStyles } from './modules/class'
import {
  getExtraChildNode,
  getExtraChildNodes,
  getExtraParentNode,
  isExtraTextNode,
  isTextElement,
  setExtraChildNode,
  setExtraChildNodes,
  setExtraIsTextNode,
  setExtraParentNode,
} from './helpers/node'

let rootDocument: UniXDocument
export function getDocument() {
  return rootDocument
}

export function setDocument(document: UniXDocument) {
  rootDocument = document
}

/**
 * 判断是否在document中
 * @param el
 * @returns
 */
export function isInDocument(parent: UniXElement): boolean {
  return !!parent.pageId
}

function updateTextNode(node: UniXElement) {
  // TODO use native TextNode
  const childNode = getExtraChildNode(node)
  if (childNode !== null) {
    // TODO multi TextNode
    const text = childNode!.getAttribute('value')
    node.setAttribute('value', text || '')
  }
}

export const nodeOps: Omit<
  RendererOptions<UniXElement, UniXElement>,
  'patchProp'
> = {
  insert: (el, parent, anchor) => {
    // TODO use native TextNode
    if (isTextElement(parent)) {
      if (isExtraTextNode(el)) {
        // TODO multi TextNode
        const childNode = getExtraChildNode(parent)
        if (childNode !== null) {
          console.error('Multiple text nodes are not allowed.')
        } else {
          setExtraChildNode(parent, el)
          setExtraParentNode(el, parent)
          updateTextNode(parent)
        }
        return
      }
    }
    if (!anchor) {
      parent.appendChild(el)
    } else {
      parent.insertBefore(el, anchor)
    }
    // 判断是不是首次被完整插入DOM树中
    // vue 插入节点的顺序是，先子后父，所以等待父真正被完整插入document时，再遍历一遍子节点校正父子选择器样式
    if (isInDocument(parent)) {
      updateClassStyles(el)
      updateChildrenClassStyle(el)
    }
  },
  remove: child => {
    const parent = child.parentNode
    if (parent) {
      const childNodes = getExtraChildNodes(parent)
      if (childNodes !== null) {
        const index = childNodes.indexOf(child)
        if (index !== -1) {
          childNodes.splice(index, 1)
          setExtraChildNodes(parent, childNodes)
        }
      }
      parent.removeChild(child)
    }
  },
  createElement: (tag, container): UniXElement => {
    return getDocument().createElement(tag)
  },
  createText: (text, container) => {
    const textNode = getDocument().createElement('text')
    textNode.setAttribute('value', text)
    setExtraIsTextNode(textNode, true)
    return textNode
  },
  createComment: (text, container) => {
    return getDocument().createComment(text)
  },
  setText: (node, text) => {
    node.setAttribute('value', text)

    // TODO use native TextNode
    const parent = getExtraParentNode(node)
    if (parent !== null) {
      updateTextNode(parent)
    }
  },
  setElementText: (el, text) => {
    // 非文本节点自动嵌套文本子节点
    if (el.tagName !== 'TEXT') {
      const childNodes = el.childNodes
      let textNode = childNodes.find(node => node.tagName === 'TEXT')
      if (!textNode) {
        const textNode = nodeOps.createText(text, el)
        el.appendChild(textNode)
        return
      }
      el = textNode
    }
    el.setAttribute('value', text)
  },
  parentNode: node => node.parentNode as UniXElement | null,
  nextSibling: node => node.nextSibling,
}

// patchClass 先子后父，所以插入父的时候 updateChildrenClassStyle
function updateChildrenClassStyle(el: UniXElement | null) {
  if (el !== null) {
    el.childNodes.forEach(child => {
      updateClassStyles(child)
      updateChildrenClassStyle(child)
    })
  }
}
