const borderTopLeftRadius = 'borderTopLeftRadius'
const borderTopRightRadius = 'borderTopRightRadius'
const borderBottomRightRadius = 'borderBottomRightRadius'
const borderBottomLeftRadius = 'borderBottomLeftRadius'

export const transformBorderRadius = function (
  prop: string,
  value: string
): Map<string, any> {
  const splitResult = value.split(/\s+/)
  const result = new Map<string, any>()
  if (value.includes('/')) {
    result.set(prop, value)
    return result
  }
  switch (splitResult.length) {
    case 1:
      result.set(prop, value)
      return result
    case 2:
      splitResult.push(splitResult[0], splitResult[1])
      break
    case 3:
      splitResult.push(splitResult[1])
      break
  }
  result.set(borderTopLeftRadius, splitResult[0])
  result.set(borderTopRightRadius, splitResult[1])
  result.set(borderBottomRightRadius, splitResult[2])
  result.set(borderBottomLeftRadius, splitResult[3])
  return result
}
