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

  test.each([
    ['', ''],
    [' \t\n\u00a0\u3000', ''],
    ['a', '^a'],
    [' a\tb\nc\u00a0d\u3000e ', '^a ^b ^c ^d ^e'],
    ['a a', '^a ^a'],
    ['^a ^^b', '^^a ^^^b'],
    [['a', ['b', { c: true, d: false }]], '^a ^b ^c'],
    [
      new Map([
        ['a', true],
        ['b', false],
      ]),
      '^a',
    ],
    [null, ''],
    [false, ''],
  ])('直接生成字符串保留归一化结果：%j', (value, expected) => {
    const instance = create({ labelClass: value, plainClass: value })
    expect(instance.props.labelClass).toBe(expected)
    expect(instance.props.plainClass).toBe(expected)
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
  test.each([false, true])(
    '条件绑定在未传、undefined、null 和清空之间切换（优化：%s）',
    optimized => {
      let previous: Record<string, unknown> = {}
      const instance = create(previous)
      if (optimized) {
        instance.vnode.patchFlag = PatchFlags.PROPS
        instance.vnode.dynamicProps = ['label-class']
      }
      const cases: [Record<string, unknown>, string][] = [
        [{ 'label-class': 'a b' }, '^a ^b'],
        [{ 'label-class': undefined }, '^local'],
        [{ 'label-class': null }, ''],
        [{ 'label-class': ['a', 'b'] }, '^a ^b'],
        [{ 'label-class': [] }, ''],
        [{ 'label-class': '' }, ''],
        [{}, 'local'],
      ]
      for (const [rawProps, expected] of cases) {
        // v-bind 对象删除属性走 FULL_PROPS，固定动态属性的 PROPS 路径仍保留键。
        if (optimized && !('label-class' in rawProps)) {
          instance.vnode.patchFlag = PatchFlags.FULL_PROPS
        }
        updateProps(instance, rawProps, previous, optimized)
        expect(instance.props.labelClass).toBe(expected)
        previous = rawProps
      }
    },
  )
})
