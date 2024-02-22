const top = 'Top'
const right = 'Right'
const bottom = 'Bottom'
const left = 'Left'

export const transformMargin = function (
  prop: string,
  value: string
): Map<string, any> {
  const splitResult: string[] = value.split(/\s+/)
  switch (splitResult.length) {
    case 1:
      splitResult.push(splitResult[0], splitResult[0], splitResult[0])
      break
    case 2:
      splitResult.push(splitResult[0], splitResult[1])
      break
    case 3:
      splitResult.push(splitResult[1])
      break
  }
  const result = new Map<string, any>()
  result.set(prop + top, splitResult[0])
  result.set(prop + right, splitResult[1])
  result.set(prop + bottom, splitResult[2])
  result.set(prop + left, splitResult[3])
  return result
}
