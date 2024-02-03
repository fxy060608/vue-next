const properties = [
  'transitionProperty',
  'transitionDuration',
  'transitionTimingFunction',
  'transitionDelay'
]
export const transformTransition = function (
  prop: string,
  value: string
): Map<string, any> {
  const CHUNK_REGEXP =
    /^(\S*)?\s*(\d*\.?\d+(?:ms|s)?)?\s*(\S*)?\s*(\d*\.?\d+(?:ms|s)?)?$/

  const match = CHUNK_REGEXP.exec(value)
  const result = new Map<string, any>()
  if (match == null) {
    result.set(prop, value)
    return result
  }
  const len = match.length //as Int
  for (let i = 1; i < len && i <= 4; i++) {
    const val = match[i]
    if (match[i] != null && val!.length > 0) {
      result.set(properties[i - 1], val!)
    }
  }
  return result
}
