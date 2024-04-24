import { patchStyle } from '../src/modules/style'
import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

describe('modules style.ts', () => {
  // mock el.updateStyle
  const el = {
    updateStyle: vi.fn(),
    ext: {
      style: new Map(),
      classStyle: new Map(),
    },
  } as unknown as UniXElement

  vi.mock('../src/helpers/node.ts', () => {
    return {
      getExtraClassStyle: vi.fn(() => new Map()),
      getExtraStyle: vi.fn(() => new Map()),
    }
  })

  beforeEach(() => {})

  it('重复值不会触发更新', async () => {
    patchStyle(el, { color: 'red' }, { color: 'red' })
    expect(el.updateStyle).not.toBeCalled()
    expect(el.updateStyle).toBeCalledTimes(0)
  })

  it('不同值合并相同值', async () => {
    patchStyle(el, { color: 'red' }, { color: 'blue' })

    expect(el.updateStyle).toBeCalledWith(new Map([['color', 'blue']]))

    patchStyle(el, { color: 'red', fontSize: 14 }, { color: 'blue' })

    expect(el.updateStyle).toBeCalled()
    expect(el.updateStyle).toBeCalledWith(
      new Map([
        ['color', 'blue'],
        ['fontSize', ''],
      ]),
    )
    patchStyle(el, { color: 'red' }, { color: 'blue', fontSize: 14 })
    expect(el.updateStyle).toBeCalled()

    expect(el.updateStyle).toBeCalledWith(
      new Map([
        ['color', 'blue'],
        ['fontSize', '14'],
      ]),
    )
  })

  it('不同展开合并相同值', async () => {
    patchStyle(
      el,
      { borderColor: 'red blue green yellow' },
      { borderColor: 'green yellow red blue ' },
    )
    expect(el.updateStyle).toBeCalled()

    expect(el.updateStyle).toBeCalledWith(
      new Map([
        ['borderTopColor', 'green'],
        ['borderRightColor', 'yellow'],
        ['borderBottomColor', 'red'],
        ['borderLeftColor', 'blue'],
      ]),
    )

    patchStyle(
      el,
      { borderColor: 'red' },
      { borderColor: 'green yellow red blue' },
    )
    expect(el.updateStyle).toBeCalled()

    expect(el.updateStyle).toBeCalledWith(
      new Map([
        ['borderTopColor', 'green'],
        ['borderRightColor', 'yellow'],
        ['borderBottomColor', 'red'],
        ['borderLeftColor', 'blue'],
      ]),
    )

    patchStyle(
      el,
      { borderColor: 'green yellow red blue' },
      { borderColor: 'red' },
    )
    expect(el.updateStyle).toBeCalled()

    expect(el.updateStyle).toBeCalledWith(new Map([['borderColor', 'red']]))
  })
})
