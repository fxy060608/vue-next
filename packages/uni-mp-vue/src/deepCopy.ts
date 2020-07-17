import { hasOwn } from '@vue/shared'
/**
 * Compatible with mp-weixin
 * @param obj
 */
export default function deepCopy(obj: any): any {
  const type = typeof obj
  if (type === 'object' && obj !== null) {
    if (obj instanceof Array) {
      const ret = []
      for (let i = 0; i < obj.length; i++) {
        ret[i] = deepCopy(obj[i])
      }
      return ret
    }
    const ret = Object.create(null)
    for (const name in obj) {
      if (hasOwn(obj, name)) {
        ret[name] = deepCopy(obj[name])
      }
    }
    return ret
  }
  if (type !== 'symbol') {
    return obj
  }
}
