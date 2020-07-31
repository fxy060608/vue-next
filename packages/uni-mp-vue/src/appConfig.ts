import { AppConfig } from '@vue/runtime-core'

import { errorHandler } from '@vue/uni-vue'

import { nextTick } from './nextTick'

export function initAppConfig(appConfig: AppConfig) {
  appConfig.errorHandler = errorHandler
  appConfig.globalProperties.$nextTick = function $nextTick(fn?: () => void) {
    return nextTick(this.$, fn)
  }
}
