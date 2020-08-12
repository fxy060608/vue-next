import { AppConfig } from '@vue/runtime-core'

import { nextTick } from './nextTick'

export function initAppConfig(appConfig: AppConfig) {
  appConfig.globalProperties.$nextTick = function $nextTick(fn?: () => void) {
    return nextTick(this.$, fn)
  }
}
