import { isString } from '@vue/shared'
import { transformBackground } from './background'
import { transformBorder } from './border'
import { transformBorderColor } from './borderColor'
import { transformBorderRadius } from './borderRadius'
import { transformBorderStyle } from './borderStyle'
import { transformBorderWidth } from './borderWidth'
// TODO
// import { transformFont } from './font'
import { transformMargin } from './margin'
import { transformPadding } from './padding'
import { transformTransition } from './transition'

const importantRE = /\s*!important$/

/**
 * 聚合所有可展开的 css 解析逻辑
 */
const DeclTransforms = new Map<
  string,
  (prop: string, value: string) => Map<string, any>
>([
  ['transition', transformTransition],
  ['margin', transformMargin],
  ['padding', transformPadding],
  ['border', transformBorder],
  ['borderTop', transformBorder],
  ['borderRight', transformBorder],
  ['borderBottom', transformBorder],
  ['borderLeft', transformBorder],
  ['borderStyle', transformBorderStyle],
  ['borderWidth', transformBorderWidth],
  ['borderColor', transformBorderColor],
  ['borderRadius', transformBorderRadius],
  ['background', transformBackground],
])

/**
 * eg: width, null => map [['border', '']]
 */
export function expandStyle(prop: string, value: any | null): Map<string, any> {
  // 为 null 时，设置为空字符串
  if (value == null) {
    return new Map([[prop, '']])
  }

  // 强转为字符串
  if (!isString(value)) {
    value = '' + value
  }

  const important: boolean = importantRE.test(value as string)
  // TODO 运行时的样式不支持 !important，需要把 !important 移除
  const newVal = important
    ? (value as string).replace(importantRE, '')
    : (value as string)

  const transform = DeclTransforms.get(prop)
  if (transform != null) {
    return transform(prop, newVal)
  }
  return new Map([[prop, newVal]])
}
