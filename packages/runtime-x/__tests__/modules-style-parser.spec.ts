import { camelize } from 'vue'
import { parseStyleDecl } from '../src/modules/style/parser/index'

// packages/runtime-core/__tests__/dom/expandStyle.spec.ts
describe('测试 parseStyleDecl', () => {
  const expandedSymbol = Symbol('expanded')

  const commonValue = {
    [expandedSymbol]: true,
    replaceWith: expect.any(Function),
  }

  it('解析 style，返回 Declaration[]', () => {
    let result
    result = parseStyleDecl(camelize('width'), '')
    expect(result).toEqual([
      expect.objectContaining({
        prop: 'width',
        value: '',
        important: false,
        ...commonValue,
      }),
    ])
    result = parseStyleDecl(camelize('font-size'), 14)
    expect(result).toEqual([
      expect.objectContaining({
        prop: 'fontSize',
        value: '14',
        important: false,
        ...commonValue,
      }),
    ])
  })
  it('解析简写属性', () => {
    let result
    result = parseStyleDecl(camelize('border'), '1px solid red')
    expect(result.length).toEqual(12)
    expect(result.map(i => i.prop)).toEqual([
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'borderTopStyle',
      'borderRightStyle',
      'borderBottomStyle',
      'borderLeftStyle',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ])

    result = parseStyleDecl(camelize('borderColor'), 'green yellow red blue')
    expect(result.length).toEqual(4)
    expect(result.map(i => i.prop)).toEqual([
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ])
    expect(result.map(i => i.value)).toEqual(['green', 'yellow', 'red', 'blue'])

    result = parseStyleDecl(camelize('borderWidth'), '1px 2px 3px 4px')
    expect(result.length).toEqual(4)
    expect(result.map(i => i.prop)).toEqual([
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
    ])
    expect(result.map(i => i.value)).toEqual(['1px', '2px', '3px', '4px'])
  })
  it('空值 border回退默认值', () => {
    let result

    result = parseStyleDecl(camelize('border'), '')
    expect(result.length).toEqual(12)

    expect(result.find(i => i.prop === 'borderTopColor')?.value).toEqual(
      '#000000',
    )
    expect(result.find(i => i.prop === 'borderTopWidth')?.value).toEqual(
      'medium',
    )
    expect(result.find(i => i.prop === 'borderTopStyle')?.value).toEqual('none')
  })
  it('空值 border回退默认值', () => {
    let result

    result = parseStyleDecl(camelize('background'), '')
    expect(result.length).toEqual(2)
    expect(result.map(i => i.prop)).toEqual([
      'backgroundImage',
      'backgroundColor',
    ])
    expect(result.map(i => i.value)).toEqual(['none', 'transparent'])

    result = parseStyleDecl(camelize('backgroundImage'), 'none')
    expect(result.length).toEqual(1)
    expect(result.map(i => i.prop)).toEqual(['backgroundImage'])
    expect(result.map(i => i.value)).toEqual(['none'])
  })
})
