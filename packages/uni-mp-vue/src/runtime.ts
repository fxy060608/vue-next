export { createVueApp } from './renderer'
// vue-global-api
export { defineAsyncComponent } from './utils'
export { logError } from '@vue/runtime-core'
export { injectHook } from '@vue/runtime-core'
export { getExposeProxy, isInSSRComponentSetup } from '@vue/runtime-core'
export { setCurrentRenderingInstance } from '@vue/runtime-core'
export { updateProps } from '@vue/runtime-core'
export { invalidateJob, hasQueueJob } from '@vue/runtime-core'
export { EMPTY_OBJ } from '@vue/shared'
export { setTemplateRef } from './rendererTemplateRef'
// @vue/reactivity
export {
  // core
  reactive,
  ref,
  readonly,
  // utilities
  unref,
  proxyRefs,
  isRef,
  toRef,
  toValue,
  toRefs,
  isProxy,
  isReactive,
  isReadonly,
  isShallow,
  // advanced
  customRef,
  triggerRef,
  shallowRef,
  shallowReactive,
  shallowReadonly,
  markRaw,
  toRaw,
  // effect
  effect,
  stop,
  ReactiveEffect,
  // effect scope
  effectScope,
  EffectScope,
  getCurrentScope,
  onScopeDispose,
} from '@vue/reactivity'

export {
  callWithAsyncErrorHandling,
  callWithErrorHandling,
  camelize,
  computed,
  createPropsRestProxy,
  defineComponent,
  defineEmits,
  defineExpose,
  defineProps,
  getCurrentInstance,
  inject,
  mergeDefaults,
  mergeProps,
  mergeModels,
  nextTick,
  normalizeClass,
  normalizeProps,
  normalizeStyle,
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
  onServerPrefetch,
  onUpdated,
  provide,
  // pinia 使用到了
  hasInjectionContext,
  queuePostFlushCb,
  resolveComponent,
  resolveDirective,
  resolveFilter,
  toDisplayString,
  toHandlerKey,
  toHandlers,
  useAttrs,
  useSSRContext,
  useSlots,
  version,
  warn,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  withAsyncContext,
  withCtx,
  withDefaults,
  withDirectives,
  // withKeys,
  // withMemo,
  // withModifiers,
  guardReactiveProps,
  withScopeId,
  // vue-i18n 使用到了
  Text,
  Fragment,
  // 新增
  useModel,
} from '@vue/runtime-core'
export { useCssModule } from '@vue/runtime-dom'
export { useCssVars } from './helpers/useCssVars'
