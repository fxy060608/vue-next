import type { ComponentInternalInstance } from '@vue/runtime-core'
import { type ElementWithTransition, vtcKey } from '../components/Transition'

// compiler should normalize class + :class bindings on the same element
// into a single binding ['staticClass', dynamic]
export function patchClass(el: Element, value: string | null, isSVG: boolean) {
  // directly setting className should be faster than setAttribute in theory
  // if this is an element during a transition, take the temporary transition
  // classes into account.
  // fixed by xxxxxx wxs
  const { __wxsAddClass, __wxsRemoveClass } = el as unknown as {
    __wxsAddClass: string[]
    __wxsRemoveClass: string[]
  }
  if (__wxsRemoveClass && __wxsRemoveClass.length) {
    value = (value || '')
      .split(/\s+/)
      .filter(v => __wxsRemoveClass.indexOf(v) === -1)
      .join(' ')
    __wxsRemoveClass.length = 0
  }
  if (__wxsAddClass && __wxsAddClass.length) {
    value = (value || '') + ' ' + __wxsAddClass.join(' ')
  }
  const transitionClasses = (el as ElementWithTransition)[vtcKey]
  if (transitionClasses) {
    value = (
      value ? [value, ...transitionClasses] : [...transitionClasses]
    ).join(' ')
  }
  if (value == null) {
    el.removeAttribute('class')
  } else if (isSVG) {
    el.setAttribute('class', value)
  } else {
    // fixed by xxxxxx
    if (__X_VAPOR__) {
      el.className = processParentScopedClass(el, value)
    } else {
      el.className = value
    }
  }
}

// fixed by xxxxxx
function processParentScopedClass(el: Element, classValue: string): string {
  // 使用 vnode.ctx（定义该 vnode 的组件），而不是渲染时的 parentComponent
  const instance = (el as any).__vueVNodeCtx as
    | ComponentInternalInstance
    | null
    | undefined
  if (!instance) {
    return classValue
  }
  if (!classValue || classValue.indexOf('^') === -1) {
    return classValue
  }

  const classes = classValue.split(/\s+/)
  const processed: string[] = []
  let maxLevel = 0

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i]
    if (cls.charCodeAt(0) === 94) {
      let level = 1
      while (cls.charCodeAt(level) === 94) {
        level++
      }
      const actualClass = cls.slice(level)
      if (actualClass) {
        processed.push(actualClass)
        if (level > maxLevel) {
          maxLevel = level
        }
      }
    } else {
      processed.push(cls)
    }
  }

  // 从定义组件开始向上遍历祖先链，直到找到 maxLevel 个不同的 scopeId
  // 跳过内置组件（type.__reserved 为 true）
  let current: ComponentInternalInstance | null | undefined = instance.parent
  let scopeIdCount = 0
  while (current && scopeIdCount < maxLevel) {
    // 跳过内置组件
    if ((current.type as any).__reserved) {
      current = current.parent
      continue
    }
    const scopeId = current.vnode.scopeId
    if (scopeId) {
      el.setAttribute(scopeId, '')
      scopeIdCount++
    }
    current = current.parent
  }

  return processed.join(' ')
}
