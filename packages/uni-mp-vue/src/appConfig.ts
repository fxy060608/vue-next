import { AppConfig, ComponentPublicInstance } from '@vue/runtime-core'
import { warn } from '@vue/runtime-core'

import { UniLifecycleHooks } from './apiLifecycle'

function errorHandler(
  err: unknown,
  instance: ComponentPublicInstance | null,
  info: string
) {
  let hasOnError = false
  if (instance) {
    const appInstance = (instance.$.appContext as any).$appInstance
    hasOnError =
      appInstance &&
      appInstance.$hasHook(appInstance, UniLifecycleHooks.ON_ERROR)
    hasOnError && appInstance.$callHook(UniLifecycleHooks.ON_ERROR, err)
  }
  if (!hasOnError) {
    if (__DEV__) {
      warn(`Error in ${info}: "${err}"`, instance)
    } else {
      console.error(err)
    }
  }
}

export function initAppConfig(appConfig: AppConfig) {
  appConfig.errorHandler = errorHandler
}
