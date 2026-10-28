import type { ComponentInternalInstance } from 'vue'
import { patchAttr } from '../../runtime-x/src/modules/attrs'
import type { Element as UniXElement } from '@dcloudio/uni-app-x/types/native'
import { createComponentInstance } from '../../runtime-core/src/component'
import { initProps, updateProps } from '../../runtime-core/src/componentProps'
import { createVNode } from '../../runtime-core/src/vnode'
import { enableStyleIsolation } from '../../runtime-core/src/styleIsolation'
import { ShapeFlags } from '@vue/shared'

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

describe('外部类用于原生特殊样式属性', () => {
  test.each([
    ['VIEW', 'hoverClass'],
    ['BUTTON', 'hoverClass'],
    ['NAVIGATOR', 'hoverClass'],
    ['INPUT', 'placeholderClass'],
    ['TEXTAREA', 'placeholderClass'],
    ['PICKER-VIEW', 'indicatorClass'],
    ['PICKER-VIEW', 'maskClass'],
  ])('%s.%s 支持字符串和数组中的多个外部类', (tagName, key) => {
    enableStyleIsolation()
    const parent = createComponentInstance(
      createVNode({
        styles: [{ a: { '': { color: 'red' } }, b: { '': { fontSize: 12 } } }],
      } as any),
      null,
      null,
    )
    const rawProps = { labelClass: 'a b' }
    const instance = createComponentInstance(
      createVNode(
        {
          externalClasses: ['label-class'],
          props: { labelClass: String },
        },
        rawProps,
      ),
      parent,
      null,
    )
    instance.hostInstance = parent
    initProps(instance, rawProps, ShapeFlags.STATEFUL_COMPONENT)
    expect(instance.props.labelClass).toBe('^a ^b')
    const setAnyAttribute = vi.fn()
    const el = { setAnyAttribute, tagName } as unknown as UniXElement
    for (const value of [instance.props.labelClass, ['^a', '^b'], ' ^a\t^b ']) {
      setAnyAttribute.mockClear()
      patchAttr(el, key, value, instance)
      expect(setAnyAttribute).toHaveBeenCalledWith(
        key,
        new Map<string, unknown>([
          ['color', 'red'],
          ['fontSize', 12],
        ]),
      )
    }
    const forwarded = { labelClass: instance.props.labelClass }
    const child = createComponentInstance(
      createVNode(instance.type, forwarded),
      instance,
      null,
    )
    child.hostInstance = instance
    initProps(child, forwarded, ShapeFlags.STATEFUL_COMPONENT)
    expect(child.props.labelClass).toBe('^^a ^^b')
    // 二次转传仍从原声明组件取样式，短横线属性名也走同一转换。
    patchAttr(
      el,
      key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
      child.props.labelClass,
      child,
    )
    expect(setAnyAttribute).toHaveBeenLastCalledWith(
      key,
      new Map<string, unknown>([
        ['color', 'red'],
        ['fontSize', 12],
      ]),
    )
    // 清空外部类仍需向原生层传空 Map，iOS 据此移除 hover 手势。
    updateProps(instance, { labelClass: '' }, rawProps, false)
    setAnyAttribute.mockClear()
    patchAttr(el, key, instance.props.labelClass, instance)
    expect(setAnyAttribute).toHaveBeenCalledWith(key, new Map())
  })

  test('保留按钮特殊值以及非 class 属性的空值', () => {
    const instance = createComponentInstance(createVNode({}), null, null)
    const setAnyAttribute = vi.fn()
    const el = { setAnyAttribute, tagName: 'BUTTON' } as unknown as UniXElement
    for (const value of ['none', 'button-hover']) {
      patchAttr(el, 'hoverClass', value, instance)
      expect(setAnyAttribute).toHaveBeenLastCalledWith('hoverClass', value)
    }
    const input = {
      setAnyAttribute,
      tagName: 'INPUT',
    } as unknown as UniXElement
    for (const key of ['placeholderStyle', 'placeholder-style', 'title']) {
      patchAttr(input, key, '', instance)
      expect(setAnyAttribute).toHaveBeenLastCalledWith(key, '')
    }
  })
})
