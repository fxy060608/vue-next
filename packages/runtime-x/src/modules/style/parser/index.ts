import { expandStyle } from './expand'

/**
 * 解析 style，返回 Map
 * eg: width, null => map [['width', '']]
 */
export function parseStyleDecl(
  prop: string,
  value: any | null
): Map<string, any> {
  return expandStyle(prop, value)
}
