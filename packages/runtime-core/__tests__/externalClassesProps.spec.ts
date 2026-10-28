import { normalizeClass } from '@dcloudio/uni-shared'
import { createComponentInstance } from '../src/component'
import {
  initProps,
  toExternalClasses,
  updateProps,
} from '../src/componentProps'
import { createVNode } from '../src/vnode'
import { PatchFlags, ShapeFlags } from '@vue/shared'

describe('externalClasses prop 字符串', () => {
  beforeEach(() => {
    vi.stubGlobal('__X__', true)
    vi.stubGlobal('__X_STYLE_ISOLATION__', true)
    vi.stubGlobal('__X_STYLE_ISOLATION_UP_ARROW__', true)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
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

  test('页面来源使用 ~ 且转传保留页面标记', () => {
    const instance = create({
      labelClass: 'a b',
      [Symbol.for('uni.externalClasses.sourcePage')]: true,
    })
    expect(instance.props.labelClass).toBe('~a ~b')
    const child = create({ labelClass: instance.props.labelClass })
    expect(child.props.labelClass).toBe('~a ~b')
  })

  test('原生 externalClasses 分支保留样式槽名称', () => {
    vi.stubGlobal('__X_STYLE_ISOLATION_UP_ARROW__', false)
    expect(create({ labelClass: 'a b' }).props.labelClass).toBe('label-class')
  })

  test.each([false, true])(
    '页面标记在动态更新时保留（优化：%s）',
    optimized => {
      const previous = { 'label-class': 'old' }
      const instance = create(previous)
      if (optimized) {
        instance.vnode.patchFlag = PatchFlags.PROPS
        instance.vnode.dynamicProps = ['label-class']
      }
      updateProps(
        instance,
        {
          'label-class': 'a b',
          [Symbol.for('uni.externalClasses.sourcePage')]: true,
        },
        previous,
        optimized,
      )
      expect(instance.props.labelClass).toBe('~a ~b')
    },
  )

  test.each(['__X__', '__X_STYLE_ISOLATION__'])(
    '关闭 %s 时保持普通 prop 语义',
    flag => {
      vi.stubGlobal(flag, false)
      expect(create({ labelClass: 'a b' }).props.labelClass).toBe('a b')
    },
  )
  test.each([false, true])(
    '直接拼接保留来源和空白规则（页面：%s）',
    sourceIsPage => {
      const values = [
        '',
        ' \t\n\u00a0\u3000',
        'a',
        'a a',
        ' a\tb\nc\u00a0d\u3000e ',
        '^a ^^b',
        '~a ^b ~c',
        ['a', ['^b', { c: true }]],
        { a: true, b: false },
        null,
        false,
      ]
      for (const value of values) {
        const instance = create({
          plainClass: value,
          [Symbol.for('uni.externalClasses.sourcePage')]: sourceIsPage,
        })
        expect(instance.props.plainClass).toBe(
          toExternalClasses(normalizeClass(value), sourceIsPage).join(' '),
        )
      }
    },
  )
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
