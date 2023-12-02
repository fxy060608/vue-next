export function isUndef(val: unknown) {
  return val === undefined || val === null
}

export function toMap<K extends string | number | symbol = string, V = any>(
  value: Record<K, V> | Map<K, V>
): Map<K, V> {
  if (value instanceof Map) {
    return value
  }
  const map = new Map()
  for (const key in value) {
    map.set(key, value[key])
  }
  return map
}

export { parseClassList, parseClassStyles } from './useCssStyles'
