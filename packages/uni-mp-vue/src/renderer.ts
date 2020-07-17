import { ShapeFlags, invokeArrayFns, isArray, NOOP } from '@vue/shared'

import { stop, ReactiveEffectOptions, effect } from '@vue/reactivity'

import { warn } from '@vue/runtime-core'
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
  PublicAPIComponent
} from '../../runtime-core/src/component'

import { queueJob } from '../../runtime-core/src/scheduler'

import { patch } from './patch'
import { callHook, onApplyOptions } from './apiLifecycle'

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
  parentComponent: ComponentInternalInstance | null
  onBeforeSetup?: (instance: ComponentInternalInstance) => void
}

export const queuePostRenderEffect = queuePostFlushCb

function mountComponent(
  initialVNode: VNode,
  options: CreateComponentOptions
): ComponentPublicInstance {
  const instance: ComponentInternalInstance = (initialVNode.component = createComponentInstance(
    initialVNode,
    options.parentComponent,
    null
  ))

  // mp
  if (options.mpType) {
    const ctx = instance.ctx
    ctx.mpType = options.mpType
    ctx.$scope = options.mpInstance
    if (__FEATURE_OPTIONS__) {
      ctx.$onApplyOptions = onApplyOptions
    }
    if (options.mpType === 'app') {
      instance.render = NOOP
    }
    const oldEmit = instance.emit
    instance.emit = function(event, ...args) {
      if (ctx.$scope && event) {
        ;(ctx.$scope as any).triggerEvent(event, { __args__: args })
      }
      return oldEmit.apply(this, [event, ...args])
    }
  }

  // slots
  instance.slots = {}
  if (isArray(options.slots) && options.slots.length) {
    options.slots.forEach(name => {
      instance.slots[name] = true as any
    })
  }

  if (options.onBeforeSetup) {
    options.onBeforeSetup(instance)
  }

  if (__DEV__) {
    pushWarningContext(initialVNode)
  }
  setupComponent(instance)
  setupRenderEffect(instance)
  if (__DEV__) {
    popWarningContext()
  }
  return instance.proxy as ComponentPublicInstance
}
const prodEffectOptions = {
  scheduler: queueJob
}

function createDevEffectOptions(
  instance: ComponentInternalInstance
): ReactiveEffectOptions {
  return {
    scheduler: queueJob,
    onTrack: instance.rtc ? e => invokeArrayFns(instance.rtc!, e) : void 0,
    onTrigger: instance.rtg ? e => invokeArrayFns(instance.rtg!, e) : void 0
  }
}
function setupRenderEffect(instance: ComponentInternalInstance) {
  // create reactive effect for rendering
  instance.update = effect(function componentEffect() {
    if (!instance.isMounted) {
      const { bm } = instance
      // beforeMount hook
      if (bm) {
        invokeArrayFns(bm)
      }
      patch(instance)
      instance.isMounted = true
    } else {
      // updateComponent
      const { bu, u } = instance
      // beforeUpdate hook
      if (bu) {
        invokeArrayFns(bu)
      }
      patch(instance)
      // updated hook
      if (u) {
        queuePostRenderEffect(u)
      }
    }
  }, __DEV__ ? createDevEffectOptions(instance) : prodEffectOptions)
}

function unmountComponent(instance: ComponentInternalInstance) {
  const { bum, effects, update, um } = instance
  // beforeUnmount hook
  if (bum) {
    invokeArrayFns(bum)
  }
  if (effects) {
    for (let i = 0; i < effects.length; i++) {
      stop(effects[i])
    }
  }
  // update may be null if a component is unmounted before its async
  // setup has resolved.
  if (update) {
    stop(update)
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

function initGlobalProperties(globalProperties: Record<string, any>) {
  globalProperties.$callHook = callHook
}

export function createApp(rootComponent: PublicAPIComponent, rootProps = null) {
  const app = oldCreateApp(rootComponent, rootProps)
  const appContext = app._context

  initGlobalProperties(appContext.config.globalProperties)

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

  const destroyComponent: (
    component: ComponentPublicInstance
  ) => void = function destroyComponent(component) {
    return component && unmountComponent(component.$)
  }

  app.mount = function mount() {
    const instance = mountComponent(
      createVNode({ type: rootComponent } as VNode),
      {
        mpType: MPType.APP,
        mpInstance: null, // TODO
        parentComponent: null,
        slots: []
      }
    )
    ;(instance as any).$app = app
    ;(instance as any).$createComponent = createComponent
    ;(instance as any).$destroyComponent = destroyComponent

    createMiniProgramApp(instance)

    return instance
  }

  app.unmount = function unmount() {
    warn(`Cannot unmount an app.`)
  }

  return app
}
