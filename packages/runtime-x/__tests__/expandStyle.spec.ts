import { expandStyle } from '../src/modules/style/parser/expand'

const props = [
  'border',
  'borderLeft',
  'borderRight',
  'borderTop',
  'borderBottom',
]
describe('expandStyle border', () => {
  it('test border 0 param', () => {
    props.forEach(prop => {
      let result = expandStyle(prop, '')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', '#000000'],
          [prop + 'Style', 'none'],
          [prop + 'Width', 'medium'],
        ]),
      )
    })
  })
  it('test border 1 param', () => {
    props.forEach(prop => {
      let result = expandStyle(prop, '1px')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', '#000000'],
          [prop + 'Style', 'none'],
          [prop + 'Width', '1px'],
        ]),
      )
      result = expandStyle(prop, 'solid')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', '#000000'],
          [prop + 'Style', 'solid'],
          [prop + 'Width', 'medium'],
        ]),
      )
      result = expandStyle(prop, 'red')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', 'red'],
          [prop + 'Style', 'none'],
          [prop + 'Width', 'medium'],
        ]),
      )
    })
  })
  it('test border 2 params', () => {
    props.forEach(prop => {
      let result = expandStyle(prop, '1px solid')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', '#000000'],
          [prop + 'Style', 'solid'],
          [prop + 'Width', '1px'],
        ]),
      )
      result = expandStyle(prop, '1px red')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', 'red'],
          [prop + 'Style', 'none'],
          [prop + 'Width', '1px'],
        ]),
      )
      result = expandStyle(prop, 'solid red')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', 'red'],
          [prop + 'Style', 'solid'],
          [prop + 'Width', 'medium'],
        ]),
      )
    })
  })

  it('test border 3 params', () => {
    props.forEach(prop => {
      let result = expandStyle(prop, '1px solid red')
      expect(result).toEqual(
        new Map([
          [prop + 'Color', 'red'],
          [prop + 'Style', 'solid'],
          [prop + 'Width', '1px'],
        ]),
      )

      result = expandStyle(prop, 'medium solid red')
      // normal
      expect(result).toEqual(
        new Map([
          [prop + 'Color', 'red'],
          [prop + 'Style', 'solid'],
          [prop + 'Width', 'medium'],
        ]),
      )
    })
  })
})

describe('expand background', () => {
  it('test background 0 param', () => {
    let result = expandStyle('background', '')
    expect(result).toEqual(new Map([['backgroundColor', '']]))
  })
  it('test background 1 param', () => {
    let result = expandStyle('background', 'red')
    expect(result).toEqual(new Map([['backgroundColor', 'red']]))

    // let result = expandStyle('background', 'url("test.jpg")')
    // expect(result).toEqual(new Map([['backgroundImage', 'url("test.jpg")']]))

    result = expandStyle(
      'background',
      'linear-gradient(to bottom,rgba(255, 255, 255, 0.95),rgba(255, 255, 255, 0.6))',
    )

    expect(result).toEqual(
      new Map([
        [
          'backgroundImage',
          'linear-gradient(to bottom,rgba(255, 255, 255, 0.95),rgba(255, 255, 255, 0.6))',
        ],
      ]),
    )
  })
})
