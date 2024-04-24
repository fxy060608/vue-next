import { camelize } from 'vue'
import { parseStyleDecl } from '../src/modules/style/parser/index'

// more test referer
// packages/runtime-core/__tests__/dom/expandStyle.spec.ts
describe('测试 parseStyleDecl', () => {
  it('解析 style，返回 Map', () => {
    let result
    result = parseStyleDecl(camelize('width'), null)
    expect(result).toEqual(new Map([['width', '']]))
    result = parseStyleDecl(camelize('font-size'), 14)
    expect(result).toEqual(new Map([['fontSize', '14']]))
  })
  it('解析简写属性', () => {
    let result
    result = parseStyleDecl(camelize('border'), '1px solid red')
    expect(result).toEqual(
      new Map([
        ['borderColor', 'red'],
        ['borderStyle', 'solid'],
        ['borderWidth', '1px'],
      ]),
    )

    result = parseStyleDecl(camelize('borderColor'), 'green yellow red blue')
    expect(result).toEqual(
      new Map([
        ['borderBottomColor', 'red'],
        ['borderLeftColor', 'blue'],
        ['borderRightColor', 'yellow'],
        ['borderTopColor', 'green'],
      ]),
    )
    result = parseStyleDecl(camelize('borderWidth'), '1px 2px 3px 4px')
    expect(result).toEqual(
      new Map([
        ['borderBottomWidth', '3px'],
        ['borderLeftWidth', '4px'],
        ['borderRightWidth', '2px'],
        ['borderTopWidth', '1px'],
      ]),
    )
  })
})
