import { UniElement, UniTextNode, UniCommentNode } from '@dcloudio/uni-shared'

export function createElement(tagName: string, container?: UniElement) {
  return new UniElement(tagName, container!)
}

export function createTextNode(text: string, container?: UniElement) {
  return new UniTextNode(text, container!)
}

export function createComment(text: string, container?: UniElement) {
  return new UniCommentNode(text, container!)
}
