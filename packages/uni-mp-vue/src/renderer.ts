import { ShapeFlags, invokeArrayFns, NOOP, isOn } from '@vue/shared'

import { ReactiveEffect } from '@vue/reactivity'

import {
  warn,
  VNodeProps,
  ComponentOptions,
  ErrorCodes,
  handleError
} from '@vue/runtime-core'
import { VNode } from '@vue/runtime-core'
import { queuePostFlushCb } from '@vue/runtime-core'
import { ComponentInternalInstance } from '@vue/runtime-core'
import { ComponentPublicInstance } from '@vue/runtime-core'

import { createAppAPI } from '../../runtime-core/src/apiCreateApp'
import {
  pushWarningContext,
  popWarningContext
} from '../../runtime-core/src/warning'
import {
  createComponentInstance,
  setupComponent,
  Component,
  Data,
  FunctionalComponent
} from '../../runtime-core/src/component'

import { queueJob, SchedulerJob } from '../../runtime-core/src/scheduler'
import { setCurrentRenderingInstance } from '../../runtime-core/src/componentRenderContext'

import { patch } from './patch'
import { initAppConfig } from './appConfig'
import { onApplyOptions } from './componentOptions'

export enum MPType {
  APP = 'app',
  PAGE = 'page',
  COMPONENT = 'component'
}

declare function createMiniProgramApp(
  instance: ComponentPublicInstance
): ComponentPublicInstance

export interface CreateComponentOptions {
  mpType: MPType
  mpInstance: any
  slots: string[]
  props: VNodeProps | null
  parentComponent: ComponentInternalInstance | null
  onBeforeSetup?: (
    instance: ComponentInternalInstance,
    options: CreateComponentOptions
  ) => void
}

export const queuePostRenderEffect = queuePostFlushCb

function mountComponent(
  initialVNode: VNode,
  options: CreateComponentOptions
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
  }
  setupComponent(instance)
  if (__FEATURE_OPTIONS_API__) {
    // $children
    if (options.parentComponent && instance.proxy) {
      ;(
        options.parentComponent.ctx.$children as ComponentPublicInstance[]
      ).push(instance.proxy)
    }
  }
  setupRenderEffect(instance)
  if (__DEV__) {
    popWarningContext()
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
          globalProperties: { pruneComponentPropsCache }
        }
      }
    }
  } = instance

  // event
  ;(instance as unknown as { $ei: number }).$ei = 0
  // props
  pruneComponentPropsCache(uid)

  let result
  const prev = setCurrentRenderingInstance(instance)

  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
        ctx
      )
    } else {
      // functional
      const render = Component as FunctionalComponent
      result =
        render.length > 1
          ? render(props, { attrs, slots, emit })
          : render(props, null as any /* we know it doesn't need it */)
          ? attrs
          : getFunctionalFallthrough(attrs)
    }
  } catch (err) {
    handleError(err, instance, ErrorCodes.RENDER_FUNCTION)
    result = false
  }
  setCurrentRenderingInstance(prev)
  return result
}

function setupRenderEffect(instance: ComponentInternalInstance) {
  const componentUpdateFn = () => {
    if (!instance.isMounted) {
      patch(instance, renderComponentRoot(instance))
    } else {
      // updateComponent
      const { bu, u } = instance
      effect.allowRecurse = false
      // beforeUpdate hook
      if (bu) {
        invokeArrayFns(bu)
      }
      effect.allowRecurse = true
      patch(instance, renderComponentRoot(instance))
      // updated hook
      if (u) {
        queuePostRenderEffect(u)
      }
    }
  }

  // create reactive effect for rendering
  const effect = new ReactiveEffect(
    componentUpdateFn,
    () => queueJob(instance.update),
    instance.scope // track it in component's effect scope
  )

  const update = (instance.update = effect.run.bind(effect) as SchedulerJob)
  update.id = instance.uid
  // allowRecurse
  // #1801, #2043 component render effects should allow recursive updates
  effect.allowRecurse = update.allowRecurse = true

  if (__DEV__) {
    effect.onTrack = instance.rtc
      ? e => invokeArrayFns(instance.rtc!, e)
      : void 0
    effect.onTrigger = instance.rtg
      ? e => invokeArrayFns(instance.rtg!, e)
      : void 0
    // @ts-ignore (for scheduler)
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
}

const oldCreateApp = createAppAPI()

export function createVueApp(rootComponent: Component, rootProps = null) {
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
    options: CreateComponentOptions
  ) => ComponentPublicInstance = function createComponent(
    initialVNode,
    options
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
        props: null
      }
    )
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
