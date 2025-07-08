import type { UniNode } from '@dcloudio/uni-shared'

import {
  type App,
  type AppContext,
  type ComponentPublicInstance,
  type CreateAppFunction,
  type Renderer,
  type RootRenderFunction,
  createRenderer,
  createVNode,
  type defineComponent,
  version,
} from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { forcePatchProp, patchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { extend, isHTMLTag, isSVGTag, isString } from '@vue/shared'
import { createComment } from '@vue/uni-app-service-vue'
import { devtoolsInitApp } from '@vue/runtime-core'

export * from './dom'

const rendererOptions = extend({ patchProp, forcePatchProp }, nodeOps)

// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
let renderer: Renderer<UniNode>

function ensureRenderer() {
  return (
    renderer || (renderer = createRenderer<UniNode, UniNode>(rendererOptions))
  )
}

// use explicit type casts here to avoid import() calls in rolled-up d.ts
export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<UniNode>

export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)

  if (__DEV__) {
    injectNativeTagCheck(app)
  }

  const { mount } = app
  app.mount = (container: UniNode | string): any => {
    if (isString(container)) {
      if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
        if (container === '#app') {
          devtoolsInitApp(app, version)
        }
      }
      container = createComment(container)
    }
    return container && mount(container, false, false)
  }

  return app
}) as CreateAppFunction<UniNode>

export const createSSRApp = createApp

export function createMountPage(appContext: AppContext) {
  return function mountPage(
    pageComponent: ReturnType<typeof defineComponent>,
    pageProps: Record<string, any>,
    pageContainer: UniNode,
  ): ComponentPublicInstance {
    const vnode = createVNode(pageComponent, pageProps)
    // store app context on the root VNode.
    // this will be set on the root instance on initial mount.
    vnode.appContext = appContext
    ;(vnode as any).__page_container__ = pageContainer
    render(vnode, pageContainer)
    const publicThis = vnode.component!.proxy!
    ;(publicThis as any).__page_container__ = pageContainer
    return publicThis
  }
}

export function unmountPage(pageInstance: ComponentPublicInstance): void {
  const { __page_container__ } = pageInstance as any
  if (__page_container__) {
    __page_container__.isUnmounted = true
    render(null, __page_container__)
    delete (pageInstance as any).__page_container__
    const vnode = pageInstance.$.vnode
    delete (vnode as any).__page_container__
  }
}

function injectNativeTagCheck(app: App) {
  // Inject `isNativeTag`
  // this is used for component name validation (dev only)
  Object.defineProperty(app.config, 'isNativeTag', {
    value: (tag: string) => isHTMLTag(tag) || isSVGTag(tag),
    writable: false,
  })
}

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'

// DOM-only components
export { Transition, type TransitionProps } from './components/Transition'
export {
  TransitionGroup,
  type TransitionGroupProps,
} from './components/TransitionGroup'

// **Internal** DOM-only runtime directive helpers
export { vModelText, vModelDynamic } from './directives/vModel'
export { withModifiers, withKeys } from './directives/vOn'
export { vShow } from './directives/vShow'

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
