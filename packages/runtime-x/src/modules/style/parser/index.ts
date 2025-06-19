// @ts-expect-error esm js
import { expand } from '@dcloudio/uni-nvue-styler/dist/uni-nvue-styler.es'
export type Declaration = {
  prop: string
  value: string
  important: boolean
  replaceWith: (newProps: Declaration[]) => void
}

/**
 * Declaration 的扩展，包含 expand 样式展开
 */
const processDeclaration: (decl: Declaration) => void = expand({
  type: 'uvue',
}).Declaration

/**
 * 解析 style，返回 Declaration[]
 */
export function parseStyleDecl(prop: string, value: any | null): Declaration[] {
  const newValue = String(value)
  const isImportant = newValue.includes('!important')

  const decl: Declaration = {
    prop,
    value: isImportant ? newValue.replace(/\s*!important/, '') : newValue,
    important: isImportant,
    replaceWith(newProps: Declaration[]) {
      props = newProps
    },
  }

  let props = [decl]
  processDeclaration(decl)
  return props
}
