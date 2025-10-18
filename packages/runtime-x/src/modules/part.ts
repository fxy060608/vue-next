import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import { isString } from '@vue/shared'
import {
  type NVueStyle,
  ParseStyleContext,
  isMatchParentSelector,
} from '../helpers/useCssStyles'
import { getPartElementInstance, setPartElementInstance } from '../helpers/node'
import { mergeAndUpdateClassStyles } from './class'

const PartElementContextMap = new WeakMap<UniXElement, ParseStyleContext>()
export function setPartElementContext(
  el: UniXElement,
  context: ParseStyleContext,
) {
  PartElementContextMap.set(el, context)
}

export function getPartElementContext(
  el: UniXElement,
): ParseStyleContext | null {
  return PartElementContextMap.get(el) || null
}

export function patchPart(
  el: UniXElement,
  pre: string | null,
  next: string | null,
  instance: ComponentInternalInstance | null = null,
) {
  if (instance == null) {
    return
  }
  const parentComponent = instance.parent
  if (parentComponent == null) {
    return
  }
  setPartElementInstance(el, instance)
  el.setAnyAttribute('part', next)
  updatePartStyles(el)
}

export function updatePartStyles(el: UniXElement) {
  const part = el.getAnyAttribute('part')
  if (!isString(part) || !part) {
    return
  }
  const instance = getPartElementInstance(el)
  if (instance == null) {
    return
  }
  const parentComponent = instance.parent
  if (parentComponent == null) {
    return
  }
  const hostEl = instance.subTree.el
  if (hostEl == null || hostEl.tagName == null) {
    return
  }
  const parentStylesheet = (parentComponent.type as any).styles as NVueStyle[]
  if (parentStylesheet == null || parentStylesheet.length === 0) {
    return
  }
  const partList = part.split(' ')
  const context = new ParseStyleContext()
  let stylesUpdated = false
  const partSelectors = partList.map(partName => `::part(${partName})`)
  const parentStyles = (parentStylesheet ?? []).filter(style =>
    partSelectors.some(partSelector => style[partSelector] != null),
  )
  for (let i = 0; i < parentStyles.length; i++) {
    const style = parentStyles[i]
    for (let j = 0; j < partSelectors.length; j++) {
      const partSelector = partSelectors[j]
      if (style[partSelector] != null) {
        const parentPartStyles = style[partSelector]
        for (let parentSelector in parentPartStyles) {
          if (!isMatchParentSelector(parentSelector, hostEl as UniXElement)) {
            continue
          }
          const style = parentPartStyles[parentSelector]
          const weight = parentSelector.split('.').length + 1
          for (let key in style) {
            const existing = context.weights[key]
            if (existing == null || weight >= existing) {
              context.styles.set(key, style[key])
              context.weights[key] = weight
              stylesUpdated = true
            }
          }
        }
      }
    }
  }
  if (!stylesUpdated) {
    return
  }
  setPartElementContext(el, context)
  mergeAndUpdateClassStyles(el)
}
