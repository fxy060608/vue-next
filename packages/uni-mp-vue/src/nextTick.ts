import {
  nextTick as nextVueTick,
  callWithErrorHandling,
  ComponentInternalInstance,
  ErrorCodes
} from '@vue/runtime-core'

import { queue } from '../../runtime-core/src/scheduler'

import { MPInstance } from './patch'

function hasComponentEffect(instance: ComponentInternalInstance) {
  return queue.includes(instance.update)
}

export function flushCallbacks(instance: ComponentInternalInstance) {
  const ctx = instance.ctx

  const callbacks = ctx.__next_tick_callbacks as Function[]
  if (callbacks && callbacks.length) {
    if (process.env.VUE_APP_DEBUG) {
      const mpInstance = ctx.$scope as MPInstance
      console.log(
        '[' +
          +new Date() +
          '][' +
          (mpInstance.is || mpInstance.route) +
          '][' +
          instance.uid +
          ']:flushCallbacks[' +
          callbacks.length +
          ']'
      )
    }
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for (let i = 0; i < copies.length; i++) {
      copies[i]()
    }
  }
}

export function nextTick(
  instance: ComponentInternalInstance,
  fn?: () => void
): Promise<void> {
  const ctx = instance.ctx
  if (!ctx.__next_tick_pending && !hasComponentEffect(instance)) {
    if (process.env.VUE_APP_DEBUG) {
      const mpInstance = ctx.$scope as MPInstance
      console.log(
        '[' +
          +new Date() +
          '][' +
          (mpInstance.is || mpInstance.route) +
          '][' +
          instance.uid +
          ']:nextVueTick'
      )
    }
    return nextVueTick(fn && fn.bind(instance.proxy))
  }
  if (process.env.VUE_APP_DEBUG) {
    const mpInstance = ctx.$scope as MPInstance
    console.log(
      '[' +
        +new Date() +
        '][' +
        (mpInstance.is || mpInstance.route) +
        '][' +
        instance.uid +
        ']:nextMPTick'
    )
  }
  let _resolve: any
  if (!ctx.__next_tick_callbacks) {
    ctx.__next_tick_callbacks = []
  }
  ;(ctx.__next_tick_callbacks as Function[]).push(() => {
    if (fn) {
      callWithErrorHandling(
        fn.bind(instance.proxy),
        instance,
        ErrorCodes.SCHEDULER
      )
    } else if (_resolve) {
      _resolve(instance.proxy)
    }
  })
  return new Promise(resolve => {
    _resolve = resolve
  })
}
