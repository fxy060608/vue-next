import {
  type AppContext,
  type ComponentPublicInstance,
  type CreateAppFunction,
  type Renderer,
  type RootRenderFunction,
  createRenderer,
  createVNode,
  type defineComponent,
} from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { extend } from '@vue/shared'
import type { NVueElement } from '@dcloudio/uni-shared'

const rendererOptions = extend({ patchProp }, nodeOps)

// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
let renderer: Renderer<NVueElement>

function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<NVueElement, NVueElement>(rendererOptions))
  )
}

// use explicit type casts here to avoid import() calls in rolled-up d.ts
export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<NVueElement>

export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)

  const { mount } = app
  app.mount = (container: string): any => {
    return mount(container)
  }

  return app
}) as CreateAppFunction<NVueElement>

export function createMountPage(appContext: AppContext) {
  return function mountPage(
    pageComponent: ReturnType<typeof defineComponent>,
    pageProps: Record<string, any>,
    pageContainer: NVueElement,
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

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'
export {
  useCssStyles,
  parseClassStyles,
  parseClassList,
} from './helpers/useCssStyles'
// **Internal** DOM-only runtime directive helpers
// export { vModelText } from './directives/vModel'
export { withModifiers, withKeys } from './directives/vOn'
// export { vShow } from './directives/vShow'

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
