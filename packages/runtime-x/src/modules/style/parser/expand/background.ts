const backgroundColor = 'backgroundColor'
const backgroundImage = 'backgroundImage'

export const transformBackground = function (
  prop: string,
  value: string,
): Map<string, any> {
  const result = new Map<string, any>()
  if (/^#?\S+$/.test(value) || /^rgba?(.+)$/.test(value)) {
    result.set(backgroundColor, value)
  } else if (/^linear-gradient(.+)$/.test(value)) {
    result.set(backgroundImage, value)
  } else {
    result.set(prop, value)
  }
  return result
}
