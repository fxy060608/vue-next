import { ShapeFlags } from '@vue/shared'
import { ComponentInternalInstance } from '../component'
import { ComponentPublicInstance } from '../componentPublicInstance'
import { VNode } from '../vnode'
import { assertCompatEnabled, DeprecationTypes } from './compatConfig'

export function getCompatChildren(
  instance: ComponentInternalInstance
): ComponentPublicInstance[] {
  if (!__X__) {
    assertCompatEnabled(DeprecationTypes.INSTANCE_CHILDREN, instance)
  }
  const root = instance.subTree
  const children: ComponentPublicInstance[] = []
  if (root) {
    walk(root, children)
  }
  return children
}

function isInternalComponent(p: ComponentPublicInstance | null) {
  return p && p.$options && (p.$options.__reserved || p.$options.rootElement)
}

function walk(vnode: VNode, children: ComponentPublicInstance[]) {
  if (vnode.component) {
    if (!__X__ || (__X__ && !isInternalComponent(vnode.component.proxy))) {
      children.push(vnode.component.proxy!)
    } else if (__X__ && isInternalComponent(vnode.component.proxy)) {
      walk(vnode.component.subTree, children)
    }
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    const vnodes = vnode.children as VNode[]
    for (let i = 0; i < vnodes.length; i++) {
      walk(vnodes[i], children)
    }
  }
}
