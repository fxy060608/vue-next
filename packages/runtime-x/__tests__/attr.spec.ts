import type { ComponentInternalInstance } from 'vue'
import { patchAttr } from '../../runtime-x/src/modules/attrs'
import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'

describe('test patchAttr', () => {
  test('test starts with style', () => {
    // mock el.setAnyAttribute
    const setAnyAttribute = vi.fn()
    const el = { setAnyAttribute, tagName: 'INPUT' } as unknown as UniXElement

    const mockInstance = true as unknown as ComponentInternalInstance
    patchAttr(el, 'placeholderStyle', 'color: red;font-size:12px', mockInstance)
    expect(setAnyAttribute).toBeCalledWith('placeholderStyle', {
      color: 'red',
      fontSize: '12px',
    })
  })
  test('test starts with style', () => {
    // mock el.setAnyAttribute
    const setAnyAttribute = vi.fn()
    const el = {
      setAnyAttribute,
      tagName: 'TEXTAREA',
    } as unknown as UniXElement

    const mockInstance = true as unknown as ComponentInternalInstance
    patchAttr(el, 'placeholderStyle', 'color: red;font-size:12px', mockInstance)
    expect(setAnyAttribute).toBeCalledWith('placeholderStyle', {
      color: 'red',
      fontSize: '12px',
    })
  })
  test('test starts with style', () => {
    // mock el.setAnyAttribute
    const setAnyAttribute = vi.fn()
    const el = {
      setAnyAttribute,
      tagName: 'PICKER-VIEW',
    } as unknown as UniXElement

    const mockInstance = true as unknown as ComponentInternalInstance
    patchAttr(el, 'indicatorStyle', 'color: red;font-size:12px', mockInstance)
    expect(setAnyAttribute).toBeCalledWith('indicatorStyle', {
      color: 'red',
      fontSize: '12px',
    })
  })
})
