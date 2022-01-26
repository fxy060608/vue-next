import {
  createRenderer,
  RootRenderFunction,
  CreateAppFunction,
  Renderer
} from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { extend } from '@vue/shared'
import { NVueElement } from '@dcloudio/uni-shared'

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

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'
export { useCssStyles } from './helpers/useCssStyles'
// **Internal** DOM-only runtime directive helpers
// export { vModelText } from './directives/vModel'
// export { withModifiers, withKeys } from './directives/vOn'
// export { vShow } from './directives/vShow'

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
