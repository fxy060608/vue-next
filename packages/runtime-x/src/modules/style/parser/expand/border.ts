const borderWidth = 'Width'
const borderStyle = 'Style'
const borderColor = 'Color'

export const transformBorder = function (
  prop: string,
  value: string
): Map<string, any> {
  const splitResult = value.replace(/\s*,\s*/g, ',').split(/\s+/)
  const values: Array<string | null> = [
    /^[\d\.]+\S*|^(thin|medium|thick)$/,
    /^(solid|dashed|dotted|none)$/,
    /\S+/
  ].map((item): string | null => {
    const index = splitResult.findIndex((str: string): boolean =>
      item.test(str)
    )
    return index < 0 ? null : splitResult.splice(index, 1)[0]
  })
  const result = new Map<string, any>()
  if (splitResult.length != 0) {
    result.set(prop, value)
    return result
  }
  result.set(
    prop + borderWidth,
    (values[0] == null ? 'medium' : values[0])!.trim()
  )
  result.set(
    prop + borderStyle,
    (values[1] == null ? 'none' : values[1])!.trim()
  )
  result.set(
    prop + borderColor,
    (values[2] == null ? '#000000' : values[2])!.trim()
  )
  return result
}
