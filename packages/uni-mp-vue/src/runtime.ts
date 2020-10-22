export { createVueApp } from './renderer'

export { logError } from 'packages/runtime-core/src/errorHandling'
export { injectHook } from 'packages/runtime-core/src/apiLifecycle'
export { isInSSRComponentSetup } from 'packages/runtime-core/src/component'

// @vue/reactivity
export {
  customRef,
  isProxy,
  isReactive,
  isReadonly,
  isRef,
  markRaw,
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowReadonly,
  shallowRef,
  toRaw,
  toRef,
  toRefs,
  triggerRef,
  unref
} from '@vue/runtime-core'

export {
  callWithAsyncErrorHandling,
  callWithErrorHandling,
  camelize,
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated,
  provide,
  version,
  warn,
  watch,
  watchEffect
} from '@vue/runtime-core'