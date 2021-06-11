import {
  // UniNode,
  UniElement,
  UniTextNode,
  UniCommentNode
} from '@dcloudio/uni-shared'
import UniPageNode, {
  PageNodeOptions
  // pushInsertAction,
  // pushRemoveAction,
  // pushRemoveAttributeAction,
  // pushSetAttributeAction,
  // pushSetTextAction,
} from './Page'

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

// function proxyNode<T extends UniNode>(node: T) {
//   return new Proxy(node, {
//     get(target, key, receiver) {
//       const orig = Reflect.get(target, key, receiver)
//       switch (key) {
//         case 'insertBefore':
//           return proxyInsert(orig, node)
//         case 'removeChild':
//           return proxyRemove(orig, node)
//         case 'setAttribute':
//           return proxySetAttribute(orig, node as unknown as UniElement)
//         case 'removeAttribute':
//           return proxyRemoveAttribute(orig, node as unknown as UniElement)
//         default:
//           return orig
//       }
//     },
//     set(target, key, value, receiver) {
//       if (key === 'textContent' || key === 'nodeValue') {
//         if (node.parentNode) {
//           pushSetTextAction(node.pageNode!, node.nodeId!, value)
//         }
//       }
//       return Reflect.set(target, key, value, receiver)
//     },
//   })
// }

// function proxyRemove(origMethod: UniNode['removeChild'], node: UniNode) {
//   return function removeChild(oldChild: UniNode) {
//     origMethod.call(node, oldChild)
//     if (node.parentNode) {
//       pushRemoveAction(node.pageNode!, node.nodeId!, oldChild.nodeId!)
//     }
//   }
// }

// function proxyInsert(origMethod: UniNode['insertBefore'], node: UniNode) {
//   return function insertBefore(newChild: UniNode, refChild: UniNode | null) {
//     const res = origMethod.call(node, newChild, refChild) as UniElement
//     const parentNode = res.parentNode!
//     if (parentNode) {
//       pushInsertAction(
//         res.pageNode!,
//         parentNode.nodeId!,
//         res,
//         parentNode.childNodes.indexOf(res)
//       )
//     }
//     return res
//   }
// }

// function proxySetAttribute(
//   origMethod: UniElement['setAttribute'],
//   node: UniElement
// ) {
//   return function setAttribute(qualifiedName: string, value: string) {
//     origMethod.call(node, qualifiedName, value)
//     if (node.parentNode) {
//       pushSetAttributeAction(node.pageNode!, node.nodeId!, qualifiedName, value)
//     }
//   }
// }

// function proxyRemoveAttribute(
//   origMethod: UniElement['removeAttribute'],
//   node: UniElement
// ) {
//   return function removeAttribute(qualifiedName: string) {
//     origMethod.call(node, qualifiedName)
//     if (node.parentNode) {
//       pushRemoveAttributeAction(node.pageNode!, node.nodeId!, qualifiedName)
//     }
//   }
// }
