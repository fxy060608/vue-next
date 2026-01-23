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
import { nodeOps, setDocument } from './nodeOps'
import { forcePatchProp, patchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { extend } from '@vue/shared'
import type {
  IDocument as UniXDocument,
  Element as UniXElement,
} from '@dcloudio/uni-app-x/types/native'

const rendererOptions = extend({ patchProp, forcePatchProp }, nodeOps)

// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
let renderer: Renderer<UniXElement>

function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<UniXElement, UniXElement>(rendererOptions))
  )
}

// use explicit type casts here to avoid import() calls in rolled-up d.ts
export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<UniXElement>

export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args)

  const { mount, unmount } = app
  app.mount = (container: UniXDocument): any => {
    setDocument(container)
    return mount(container.body)
  }
  app.unmount = (): void => {
    setDocument(undefined)
    unmount()
    app._container = null
    app._context.reload = () => {}
  }

  return app
}) as CreateAppFunction<UniXElement>

export function createMountPage(appContext: AppContext) {
  return function mountPage(
    pageComponent: ReturnType<typeof defineComponent>,
    pageProps: Record<string, any>,
    pageContainer: UniXElement,
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
export { useComputedStyle } from './helpers/useComputedStyle'
export {
  useCssStyles,
  parseClassStyles,
  parseClassList,
} from './helpers/useCssStyles'
// **Internal** DOM-only runtime directive helpers
export { vModelText, vModelDynamic } from './directives/vModel'
export { withModifiers, withKeys } from './directives/vOn'
export { vShow } from './directives/vShow'

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
