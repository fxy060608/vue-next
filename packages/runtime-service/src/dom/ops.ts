import { UniElement, UniTextNode, UniCommentNode } from '@dcloudio/uni-shared'
import UniPageNode, { PageNodeOptions } from './Page'

export function createPageNode(pageId: number, pageOptions: PageNodeOptions) {
  return new UniPageNode(pageId, pageOptions)
}

export function createElement(
  tagName: string,
  container?: UniElement | UniPageNode
) {
  return new UniElement(tagName, container!)
}

export function createTextNode(
  text: string,
  container?: UniElement | UniPageNode
) {
  return new UniTextNode(text, container!)
}

export function createComment(
  text: string,
  container?: UniElement | UniPageNode
) {
  return new UniCommentNode(text, container!)
}
