const backgroundColor = 'backgroundColor'
const backgroundImage = 'backgroundImage'

export const transformBackground = function (
  prop: string,
  value: string,
): Map<string, any> {
  const result = new Map<string, any>()
  // eg: #fff / rgba(0,0,0,0.5)
  if (/^#?\S+$/.test(value) || /^rgba?(.+)$/.test(value)) {
    result.set(backgroundColor, value)
    result.set(backgroundImage, '')
    // linear-gradient(90deg, #000, #fff)
  } else if (/^linear-gradient(.+)$/.test(value)) {
    result.set(backgroundImage, value)
    result.set(backgroundColor, '')
  } else if (value == '') {
    result.set(backgroundColor, '')
    result.set(backgroundImage, '')
  } else {
    result.set(prop, value)
  }
  return result
}
