import {
  UniElement,
  UniTextNode,
  UniCommentNode,
  UniInputElement,
  UniTextAreaElement
} from '@dcloudio/uni-shared'

export function createElement(tagName: string, container?: UniElement) {
  if (tagName === 'input') {
    return new UniInputElement(tagName, container!)
  } else if (tagName === 'textarea') {
    return new UniTextAreaElement(tagName, container!)
  }
  return new UniElement(tagName, container!)
}

export function createTextNode(text: string, container?: UniElement) {
  return new UniTextNode(text, container!)
}

export function createComment(text: string, container?: UniElement) {
  return new UniCommentNode(text, container!)
}
