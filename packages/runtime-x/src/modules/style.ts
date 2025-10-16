import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

import {
  type NormalizedStyle,
  camelize,
  isString,
  parseStringStyle,
} from '@vue/shared'
import {
  getExtraClassStyle,
  getExtraStyle,
  getRootElementInstance,
  setExtraStyle,
} from '../helpers/node'
import type { Declaration } from './style/parser'
import { parseStyleDecl } from './style/parser'
import type { VShowElement } from '../directives/vShow'
import { triggerComputedStyleUpdate } from '../helpers/useComputedStyle'

function isSame(a: any | null, b: any | null): boolean {
  return (isString(a) && isString(b)) ||
    (typeof a === 'number' && typeof b === 'number')
    ? a == b
    : a === b
}

export function patchStyle(
  el: UniXElement,
  prev: NormalizedStyle | string,
  next: NormalizedStyle | string,
) {
  if (!next) {
    // TODO remove styles
    // el.setStyles({})
    return
  }
  if (isString(next)) {
    next = parseStringStyle(next)
  }
  const batchedStyles = new Map<
    keyof NormalizedStyle,
    NormalizedStyle[keyof NormalizedStyle]
  >()
  const isPrevObj = prev && !isString(prev)

  if (isPrevObj) {
    // 获取 class 和 style 上的样式
    const classStyle = getExtraClassStyle(el)
    const style = getExtraStyle(el)
    // 修改 prev
    for (const key in prev) {
      // 如果 next 不存在当前 key，场景：样式被移除
      if (next[key] == null) {
        const _key = key.startsWith('--') ? key : camelize(key)

        // 尝试从 class 读取，读取不到回填为空字符串
        const value =
          classStyle != null && classStyle.has(_key)
            ? classStyle!.get(_key)
            : ''

        // 传递简写 css kye value => Map [[key, value]]
        parseStyleDecl(_key, value).forEach((item: Declaration) => {
          batchedStyles.set(item.prop, item.value)
          // 把style中的样式移除掉，否则style的优先级始终比class高
          style?.delete(item.prop)
        })

        // batchedStyles.set(camelize(key), '')
      }
    }
    for (const key in next) {
      const value = next[key]
      const prevValue = prev[key]
      if (!isSame(prevValue, value)) {
        // css var start with --
        const _key = key.startsWith('--') ? key : camelize(key)
        parseStyleDecl(_key, value).forEach((item: Declaration) => {
          batchedStyles.set(item.prop, item.value)
          style?.set(item.prop, item.value)
        })
      }
    }
  } else {
    for (const key in next) {
      const value = next[key]
      const _key = key.startsWith('--') ? key : camelize(key)
      setBatchedStyles(batchedStyles, _key, value)
    }
    setExtraStyle(el, batchedStyles)
  }
  // TODO validateStyles(el, batchedStyles)

  const instance = getRootElementInstance(el)
  if (instance && instance.computedStyleInterceptors) {
    triggerComputedStyleUpdate(instance)
  }
  if (batchedStyles.size == 0) {
    return
  }
  // validateStyles(el, batchedStyles)
  if ((el as VShowElement)._vsh) {
    batchedStyles.set('display', 'none')
  }
  el.updateStyle(batchedStyles)
}

/**
 * 接受和解析 css key,value 在 batchedStyles 添加对应样式
 * @param batchedStyles
 * @param key
 * @param value
 */
function setBatchedStyles(
  batchedStyles: Map<string, any>,
  key: string,
  value: any | null,
) {
  parseStyleDecl(key, value).forEach((item: Declaration) => {
    batchedStyles.set(item.prop, item.value)
  })
}
