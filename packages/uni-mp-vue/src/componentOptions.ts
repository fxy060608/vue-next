import {
  ComponentOptions,
  ComponentInternalInstance,
  ComponentPublicInstance
} from '@vue/runtime-core'

import { applyOptions } from '@vue/uni-vue'

export function onApplyOptions(
  options: ComponentOptions,
  instance: ComponentInternalInstance,
  publicThis: ComponentPublicInstance
) {
  applyOptions(options, instance, publicThis)
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
