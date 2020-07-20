import { isFunction } from '@vue/shared'
import {
  ComponentOptions,
  ComponentInternalInstance,
  ComponentPublicInstance
} from '@vue/runtime-core'

import { injectHook } from '../../runtime-core/src/apiLifecycle'
import { LifecycleHooks } from '../../runtime-core/src/component'

export function onApplyOptions(
  options: ComponentOptions,
  instance: ComponentInternalInstance,
  publicThis: ComponentPublicInstance
) {
  Object.keys(options).forEach(name => {
    if (name.indexOf('on') === 0) {
      const hook = options[name]
      if (isFunction(hook)) {
        injectHook(name as LifecycleHooks, hook.bind(publicThis), instance)
      }
    }
  })
  const computedOptions = options.computed
  if (computedOptions) {
    const keys = Object.keys(computedOptions)
    if (keys.length) {
      const ctx = instance.ctx
      if (!ctx.$computedKeys) {
        ctx.$computedKeys = []
      }
      ;(ctx.$computedKeys as string[]).push(...keys)
    }
  }
  // remove
  delete instance.ctx.$onApplyOptions
}
