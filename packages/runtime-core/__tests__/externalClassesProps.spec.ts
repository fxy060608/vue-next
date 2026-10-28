import { createComponentInstance } from '../src/component'
import { initProps, updateProps } from '../src/componentProps'
import { createVNode } from '../src/vnode'
import { PatchFlags, ShapeFlags } from '@vue/shared'
import { enableStyleIsolation } from '../src/styleIsolation'

describe('externalClasses prop 字符串', () => {
  beforeEach(() => {
    enableStyleIsolation()
  })

  function create(rawProps: Record<string, unknown>) {
    const vnode = createVNode(
      {
        externalClasses: ['label-class', 'plain-class'],
        props: {
          labelClass: { type: String, default: 'local' },
          plainClass: String,
          ordinary: String,
        },
      },
      rawProps,
    )
    const instance = createComponentInstance(vnode, null, null)
    initProps(instance, rawProps, ShapeFlags.STATEFUL_COMPONENT)
    return instance
  }

  test.each(
    [
      'a b',
      ['a', { b: true, c: false }],
      { a: true, b: true },
      { 'a\tb': true },
    ].map(value => [value]),
  )('多个类可直接拼接：%j', value => {
    const instance = create({
      labelClass: value,
      plainClass: value,
      ordinary: 'plain',
    })
    expect(instance.props.labelClass).toBe('^a ^b')
    expect(instance.props.plainClass).toBe('^a ^b')
    expect('base ' + instance.props.labelClass).toBe('base ^a ^b')
    expect(instance.props.ordinary).toBe('plain')
  })

  test('更新、移除和空值保留原有语义', () => {
    const instance = create({})
    expect(instance.props.labelClass).toBe('local')
    updateProps(instance, { labelClass: 'a b' }, {}, false)
    expect(instance.props.labelClass).toBe('^a ^b')
    updateProps(instance, { labelClass: '^a ^b' }, { labelClass: 'a b' }, false)
    expect(instance.props.labelClass).toBe('^^a ^^b')
    updateProps(instance, { labelClass: '  ' }, { labelClass: '^a ^b' }, false)
    expect(instance.props.labelClass).toBe('')
    updateProps(instance, {}, { labelClass: '  ' }, false)
    expect(instance.props.labelClass).toBe('local')
  })

  test('编译器标记的动态 prop 更新也返回字符串', () => {
    const previous = { labelClass: 'old', plainClass: 'old' }
    const instance = create(previous)
    instance.vnode.patchFlag = PatchFlags.PROPS
    instance.vnode.dynamicProps = ['labelClass', 'plainClass']
    updateProps(
      instance,
      { labelClass: 'a b', plainClass: 'a b' },
      previous,
      true,
    )
    expect(instance.props.labelClass).toBe('^a ^b')
    expect(instance.props.plainClass).toBe('^a ^b')
  })
})
