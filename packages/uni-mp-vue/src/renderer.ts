import {
  NOOP,
  ShapeFlags,
  invokeArrayFns,
  isModelListener,
  isOn,
  isString,
} from '@vue/shared'

import { ReactiveEffect, pauseTracking, resetTracking } from '@vue/reactivity'

import {
  type ComponentOptions,
  ErrorCodes,
  type VNodeProps,
  devtoolsComponentAdded,
  devtoolsComponentRemoved,
  devtoolsComponentUpdated,
  devtoolsInitApp,
  endMeasure,
  handleError,
  onBeforeUnmount,
  setDevtoolsHook,
  startMeasure,
  version,
  warn,
} from '@vue/runtime-core'
import type { VNode } from '@vue/runtime-core'
import { nextTick, queuePostFlushCb } from '@vue/runtime-core'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import type { ComponentPublicInstance } from '@vue/runtime-core'
import { getValueByDataPath } from '@dcloudio/uni-shared'
import { createAppAPI } from '../../runtime-core/src/apiCreateApp'
import {
  popWarningContext,
  pushWarningContext,
} from '../../runtime-core/src/warning'
import {
  type Component,
  type Data,
  type FunctionalComponent,
  createComponentInstance,
  getExposeProxy,
  setupComponent,
} from '../../runtime-core/src/component'

import {
  type SchedulerJob,
  flushPreFlushCbs,
  queueJob,
} from '../../runtime-core/src/scheduler'
import { setCurrentRenderingInstance } from '../../runtime-core/src/componentRenderContext'

import { type MPInstance, patch } from './patch'
import { initAppConfig } from './appConfig'
import { onApplyOptions } from './componentOptions'
import { diff } from '.'
import { type TemplateRef, setRef } from './rendererTemplateRef'
import type { NormalizedProps } from 'packages/runtime-core/src/componentProps'

export enum MPType {
  APP = 'app',
  PAGE = 'page',
  COMPONENT = 'component',
}

declare function createMiniProgramApp(
  instance: ComponentPublicInstance,
): ComponentPublicInstance

export interface CreateComponentOptions {
  mpType: MPType
  mpInstance: any
  slots: string[]
  props: VNodeProps | null
  parentComponent: ComponentInternalInstance | null
  onBeforeSetup?: (
    instance: ComponentInternalInstance,
    options: CreateComponentOptions,
  ) => void
}

export const queuePostRenderEffect = queuePostFlushCb

function mountComponent(
  initialVNode: VNode,
  options: CreateComponentOptions,
): ComponentPublicInstance {
  const instance: ComponentInternalInstance = (initialVNode.component =
    createComponentInstance(initialVNode, options.parentComponent, null))

  if (__FEATURE_OPTIONS_API__) {
    instance.ctx.$onApplyOptions = onApplyOptions
    instance.ctx.$children = []
  }

  if (options.mpType === 'app') {
    instance.render = NOOP
  }

  if (options.onBeforeSetup) {
    options.onBeforeSetup(instance, options)
  }

  if (__DEV__) {
    pushWarningContext(initialVNode)
    startMeasure(instance, `mount`)
  }
  if (__DEV__) {
    startMeasure(instance, `init`)
  }
  setupComponent(instance)
  if (__DEV__) {
    endMeasure(instance, `init`)
  }
  if (__FEATURE_OPTIONS_API__) {
    // $children
    if (options.parentComponent && instance.proxy) {
      ;(
        options.parentComponent.ctx.$children as (
          | ComponentPublicInstance
          | Record<string, any>
        )[]
      ).push(getExposeProxy(instance) || instance.proxy)
    }
  }
  setupRenderEffect(instance)
  if (__DEV__) {
    popWarningContext()
    endMeasure(instance, `mount`)
  }
  return instance.proxy as ComponentPublicInstance
}

const getFunctionalFallthrough = (attrs: Data): Data | undefined => {
  let res: Data | undefined
  for (const key in attrs) {
    if (key === 'class' || key === 'style' || isOn(key)) {
      ;(res || (res = {}))[key] = attrs[key]
    }
  }
  return res
}

function renderComponentRoot(instance: ComponentInternalInstance): Data {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    props,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit,
    render,
    renderCache,
    data,
    setupState,
    ctx,
    uid,
    appContext: {
      app: {
        config: {
          globalProperties: { pruneComponentPropsCache },
        },
      },
    },
    inheritAttrs,
  } = instance
  // template refs
  ;(instance as unknown as { $templateRefs: TemplateRef[] }).$templateRefs = []
  // event
  ;(instance as unknown as { $ei: number }).$ei = 0
  // props
  pruneComponentPropsCache(uid)
  ;(instance as unknown as { __counter: number }).__counter =
    (instance as unknown as { __counter: number }).__counter === 0 ? 1 : 0

  let result
  const prev = setCurrentRenderingInstance(instance)
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      fallthroughAttrs(inheritAttrs, props, propsOptions, attrs)
      // withProxy is a proxy with a different `has` trap only for
      // runtime-compiled render functions using `with` block.
      const proxyToUse = withProxy || proxy
      result = render!.call(
        proxyToUse,
        proxyToUse!,
        renderCache,
        props,
        setupState,
        data,
        ctx,
      )
    } else {
      fallthroughAttrs(
        inheritAttrs,
        props,
        propsOptions,
        Component.props ? attrs : getFunctionalFallthrough(attrs),
      )
      // functional
      const render = Component as FunctionalComponent
      result =
        render.length > 1
          ? render(props, { attrs, slots, emit })
          : render(props, null as any /* we know it doesn't need it */)
    }
  } catch (err) {
    handleError(err, instance, ErrorCodes.RENDER_FUNCTION)
    result = false
  }

  setRef(instance)
  setCurrentRenderingInstance(prev)
  return result
}

function fallthroughAttrs(
  inheritAttrs?: boolean,
  props?: Data,
  propsOptions?: NormalizedProps,
  fallthroughAttrs?: Data,
) {
  if (props && fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs).filter(
      key => key !== 'class' && key !== 'style',
    )
    if (!keys.length) {
      return
    }
    if (propsOptions && keys.some(isModelListener)) {
      keys.forEach(key => {
        if (!isModelListener(key) || !(key.slice(9) in propsOptions)) {
          props[key] = fallthroughAttrs[key]
        }
      })
    } else {
      keys.forEach(key => (props[key] = fallthroughAttrs[key]))
    }
  }
}

const updateComponentPreRender = (instance: ComponentInternalInstance) => {
  pauseTracking()
  // props update may have triggered pre-flush watchers.
  // flush them before the render update.
  flushPreFlushCbs()
  resetTracking()
}

interface ComponentInternalInstanceScopedSlots
  extends ComponentInternalInstance {
  $updateScopedSlots: () => void
  $scopedSlotsData?: { path: string; index: number; data: Data }[]
}

function componentUpdateScopedSlotsFn(
  this: ComponentInternalInstanceScopedSlots,
) {
  const scopedSlotsData = this.$scopedSlotsData
  if (!scopedSlotsData || scopedSlotsData.length === 0) {
    return
  }
  const start = Date.now()
  const mpInstance = this.ctx.$scope as MPInstance
  const oldData = mpInstance.data
  const diffData = Object.create(null)
  scopedSlotsData.forEach(({ path, index, data }) => {
    const oldScopedSlotData = getValueByDataPath(oldData, path) as Data[]
    const diffPath = isString(index) ? `${path}.${index}` : `${path}[${index}]`
    if (
      typeof oldScopedSlotData === 'undefined' ||
      typeof oldScopedSlotData[index] === 'undefined'
    ) {
      diffData[diffPath] = data
    } else {
      const diffScopedSlotData: Record<string, any> = diff(
        data,
        oldScopedSlotData[index],
      )
      Object.keys(diffScopedSlotData).forEach(name => {
        diffData[diffPath + '.' + name] = diffScopedSlotData[name]
      })
    }
  })
  scopedSlotsData.length = 0
  if (Object.keys(diffData).length) {
    if (process.env.UNI_DEBUG) {
      /* eslint-disable-next-line no-console */
      console.log(
        '[' +
          +new Date() +
          '][' +
          (mpInstance.is || mpInstance.route) +
          '][' +
          this.uid +
          '][耗时' +
          (Date.now() - start) +
          ']作用域插槽差量更新',
        JSON.stringify(diffData),
      )
    }
    mpInstance.setData(diffData)
  }
}

function toggleRecurse(
  { effect, update }: ComponentInternalInstance,
  allowed: boolean,
) {
  effect.allowRecurse = update.allowRecurse = allowed
}

function setupRenderEffect(instance: ComponentInternalInstance) {
  const updateScopedSlots = componentUpdateScopedSlotsFn.bind(
    instance as ComponentInternalInstanceScopedSlots,
  )

  ;(instance as ComponentInternalInstanceScopedSlots).$updateScopedSlots = () =>
    nextTick(() => queueJob(updateScopedSlots))

  const componentUpdateFn = () => {
    if (!instance.isMounted) {
      onBeforeUnmount(() => {
        setRef(instance, true)
      }, instance)
      if (__DEV__) {
        startMeasure(instance, `patch`)
      }
      patch(instance, renderComponentRoot(instance))
      if (__DEV__) {
        endMeasure(instance, `patch`)
      }
      if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
        devtoolsComponentAdded(instance)
      }
    } else {
      // updateComponent
      const { next, bu, u } = instance
      if (__DEV__) {
        pushWarningContext(next || instance.vnode)
      }
      // Disallow component effect recursion during pre-lifecycle hooks.
      toggleRecurse(instance, false)
      updateComponentPreRender(instance)
      // beforeUpdate hook
      if (bu) {
        invokeArrayFns(bu)
      }
      toggleRecurse(instance, true)
      if (__DEV__) {
        startMeasure(instance, `patch`)
      }
      patch(instance, renderComponentRoot(instance))
      if (__DEV__) {
        endMeasure(instance, `patch`)
      }
      // updated hook
      if (u) {
        queuePostRenderEffect(u)
      }
      if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
        devtoolsComponentUpdated(instance)
      }
      if (__DEV__) {
        popWarningContext()
      }
    }
  }

  // create reactive effect for rendering
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    NOOP,
    () => queueJob(update),
    instance.scope, // track it in component's effect scope
  ))

  const update: SchedulerJob = (instance.update = () => {
    if (effect.dirty) {
      effect.run()
    }
  })
  update.id = instance.uid
  // allowRecurse
  // #1801, #2043 component render effects should allow recursive updates
  toggleRecurse(instance, true)

  if (__DEV__) {
    effect.onTrack = instance.rtc
      ? e => invokeArrayFns(instance.rtc!, e)
      : void 0
    effect.onTrigger = instance.rtg
      ? e => invokeArrayFns(instance.rtg!, e)
      : void 0
    //  (for scheduler)
    update.ownerInstance = instance
  }

  update()
}

function unmountComponent(instance: ComponentInternalInstance) {
  const { bum, scope, update, um } = instance
  // beforeUnmount hook
  if (bum) {
    invokeArrayFns(bum)
  }
  // stop effects in component scope
  scope.stop()
  // update may be null if a component is unmounted before its async
  // setup has resolved.
  if (update) {
    update.active = false
  }
  // unmounted hook
  if (um) {
    queuePostRenderEffect(um)
  }
  queuePostRenderEffect(() => {
    instance.isUnmounted = true
  })
  if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
    devtoolsComponentRemoved(instance)
  }
}

const oldCreateApp = createAppAPI()

declare const window: any
declare const my: any

function getTarget() {
  if (typeof window !== 'undefined') {
    return window
  }
  if (typeof globalThis !== 'undefined') {
    return globalThis
  }
  if (typeof global !== 'undefined') {
    return global
  }
  if (typeof my !== 'undefined') {
    return my
  }
}

export function createVueApp(rootComponent: Component, rootProps = null) {
  const target = getTarget()
  target.__VUE__ = true
  if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
    setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__, target)
  }

  const app = oldCreateApp(rootComponent, rootProps)
  const appContext = app._context

  initAppConfig(appContext.config)

  const createVNode: (initialVNode: VNode) => VNode = initialVNode => {
    initialVNode.appContext = appContext
    initialVNode.shapeFlag = ShapeFlags.COMPONENT
    return initialVNode
  }

  const createComponent: (
    initialVNode: VNode,
    options: CreateComponentOptions,
  ) => ComponentPublicInstance = function createComponent(
    initialVNode,
    options,
  ) {
    return mountComponent(createVNode(initialVNode), options)
  }

  const destroyComponent: (component: ComponentPublicInstance) => void =
    function destroyComponent(component) {
      return component && unmountComponent(component.$)
    }

  app.mount = function mount() {
    // App.vue
    ;(rootComponent as ComponentOptions).render = NOOP
    const instance = mountComponent(
      createVNode({ type: rootComponent } as VNode),
      {
        mpType: MPType.APP,
        mpInstance: null,
        parentComponent: null,
        slots: [],
        props: null,
      },
    )
    app._instance = instance.$
    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      devtoolsInitApp(app, version)
    }
    ;(instance as any).$app = app
    ;(instance as any).$createComponent = createComponent
    ;(instance as any).$destroyComponent = destroyComponent
    ;(appContext as any).$appInstance = instance
    return instance
  }

  app.unmount = function unmount() {
    warn(`Cannot unmount an app.`)
  }

  return app
}
