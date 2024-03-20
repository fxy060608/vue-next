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
  setExtraStyle,
} from '../helpers/node'
import { parseStyleDecl } from './style/parser'

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
    const classStyle = getExtraClassStyle(el)

    const style = getExtraStyle(el)
    for (const key in prev) {
      const _key = camelize(key)
      if (next[_key] == null) {
        // const value = next[key]
        const value =
          classStyle != null && classStyle.has(_key)
            ? classStyle!.get(_key)
            : ''

        // 传递简写 css kye value => Map [[key, value]]
        parseStyleDecl(key, value).forEach((value: any, key: string) => {
          batchedStyles.set(key, value)
          // 把style中的样式移除掉，否则style的优先级始终比class高
          style?.delete(key)
        })

        // batchedStyles.set(camelize(key), '')
      }
    }
    for (const key in next) {
      const value = next[key]
      // const prevValue = prev[key]
      // if (!isSame(prevValue, value))
      {
        parseStyleDecl(camelize(key), value).forEach(
          (value: any, key: string) => {
            batchedStyles.set(key, value)
            style?.set(key, value)
          },
        )
      }
    }
  } else {
    for (const key in next) {
      const value = next[key]
      setBatchedStyles(batchedStyles, camelize(key), value)
    }
    setExtraStyle(el, batchedStyles)
  }
  // TODO validateStyles(el, batchedStyles)

  if (batchedStyles.size == 0) {
    return
  }
  // validateStyles(el, batchedStyles)

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
  parseStyleDecl(key, value).forEach((value: any, key: string) => {
    batchedStyles.set(key, value)
  })
}
