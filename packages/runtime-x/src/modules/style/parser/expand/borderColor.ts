import { capitalize, hyphenate } from '@vue/shared'

const borderTop = 'borderTop'
const borderRight = 'borderRight'
const borderBottom = 'borderBottom'
const borderLeft = 'borderLeft'

export const transformBorderColor = function (
  prop: string,
  value: string,
): Map<string, any> {
  let property = hyphenate(prop).split('-')[1]
  property = capitalize(property)
  const splitResult = value.replace(/\s*,\s*/g, ',').split(/\s+/)
  const result = new Map<string, any>()
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
  result.set(borderTop + property, splitResult[0])
  result.set(borderRight + property, splitResult[1])
  result.set(borderBottom + property, splitResult[2])
  result.set(borderLeft + property, splitResult[3])
  return result
}
