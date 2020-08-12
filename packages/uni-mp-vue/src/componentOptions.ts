import {
  ComponentOptions,
  ComponentInternalInstance,
  ComponentPublicInstance
} from '@vue/runtime-core'

export function onApplyOptions(
  options: ComponentOptions,
  instance: ComponentInternalInstance,
  publicThis: ComponentPublicInstance
) {
  instance.appContext.config.globalProperties.$applyOptions(
    options,
    instance,
    publicThis
  )
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
