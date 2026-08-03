import { toExternalClasses } from '../src/componentProps'

describe('externalClasses', () => {
  test('component 来源逐层补充 ^', () => {
    expect(toExternalClasses('foo bar', false)).toEqual(['^foo', '^bar'])
    expect(toExternalClasses('^foo', false)).toEqual(['^^foo'])
  })

  test('page 来源直接使用 ~', () => {
    expect(toExternalClasses('foo bar', true)).toEqual(['~foo', '~bar'])
    expect(toExternalClasses('^^foo', true)).toEqual(['~foo'])
  })

  test('~ 在后续转发中保持不变', () => {
    expect(toExternalClasses('~foo', false)).toEqual(['~foo'])
    expect(toExternalClasses('~foo', true)).toEqual(['~foo'])
  })

  test('忽略空白内容', () => {
    expect(toExternalClasses('  ', false)).toEqual([])
  })
})
