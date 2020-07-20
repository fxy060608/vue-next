import { AppConfig, ComponentPublicInstance } from '@vue/runtime-core'

import { logError, ErrorTypes } from '../../runtime-core/src/errorHandling'

import { UniLifecycleHooks } from './apiLifecycle'
import { nextTick } from './nextTick'

function errorHandler(
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
  logError(err, info as ErrorTypes, instance ? instance.$.vnode : null)
}

export function initAppConfig(appConfig: AppConfig) {
  appConfig.errorHandler = errorHandler

  appConfig.globalProperties.$nextTick = function $nextTick(fn?: () => void) {
    return nextTick(this.$, fn)
  }
}
