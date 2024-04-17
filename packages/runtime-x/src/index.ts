import {
  type CreateAppFunction,
  type Renderer,
  type RootRenderFunction,
  createRenderer,
} from '@vue/runtime-core'
import { nodeOps, setDocument } from './nodeOps'
import { patchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { extend } from '@vue/shared'
import type {
  IDocument as UniXDocument,
  Element as UniXElement,
} from '@dcloudio/uni-app-x/types/native'

const rendererOptions = extend({ patchProp }, nodeOps)

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

  const { mount } = app
  app.mount = (container: UniXDocument): any => {
    setDocument(container)
    return mount(container.body)
  }

  return app
}) as CreateAppFunction<UniXElement>

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'
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
