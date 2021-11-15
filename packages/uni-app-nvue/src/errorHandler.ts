import { ComponentPublicInstance } from '@vue/runtime-core'

import { logError } from '@vue/runtime-core'

import { UniLifecycleHooks } from './apiLifecycle'

export function errorHandler(
  err: unknown,
  instance: ComponentPublicInstance | null,
  info: string
) {
  let hasOnError = false
  if (instance) {
    const appInstance = (instance.$.appContext as any).$appInstance
    hasOnError = appInstance && appInstance.$hasHook(UniLifecycleHooks.ON_ERROR)
    hasOnError && appInstance.$callHook(UniLifecycleHooks.ON_ERROR, err)
  }
  logError(err, info as any, instance ? instance.$.vnode : null)
}
