import { hasOwn, isArray } from '@vue/shared'
import { unwrapper } from './utils'

function clone(
  src: object,
  seen: WeakMap<object, unknown> | Map<object, unknown>
) {
  src = unwrapper(src)
  const type = typeof src
  if (type === 'object' && src !== null) {
    let copy = seen.get(src)
    if (typeof copy !== 'undefined') {
      //  (circular refs)
      return copy
    }
    if (isArray(src)) {
      const len = src.length
      copy = new Array(len)
      seen.set(src, copy)
      for (let i = 0; i < len; i++) {
        ;(copy as unknown[])[i] = clone(src[i], seen)
      }
    } else {
      copy = {}
      seen.set(src, copy)
      for (const name in src) {
        if (hasOwn(src, name)) {
          ;(copy as Record<string, unknown>)[name] = clone(src[name], seen)
        }
      }
    }
    return copy
  }
  if (type !== 'symbol') {
    return src
  }
}
/**
 * 与微信小程序保持一致的深度克隆
 * @param src
 * @returns
 */
export function deepCopy(src: Record<string, any>) {
  return clone(src, typeof WeakMap !== 'undefined' ? new WeakMap() : new Map())
}
