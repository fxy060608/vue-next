import { extend } from '@vue/shared'

import { ComponentInternalInstance } from '@vue/runtime-core'
import { MPType } from './renderer'

import diff from './diff'
import { flushCallbacks } from './nextTick'

export interface MPInstance {
  data: any
  is: string
  route: string
  setData: (data: Record<string, any>, callback?: () => void) => void
  createSelectorQuery: Function
  createIntersectionObserver: Function
  selectAllComponents: Function
  selectComponent: Function
}

function getMPInstanceData(instance: MPInstance, keys: Set<string>) {
  const data = instance.data
  const ret = Object.create(null)
  //仅同步 data 中有的数据
  keys.forEach(key => {
    ret[key] = data[key]
  })
  return ret
}

function getVueInstanceData(instance: ComponentInternalInstance) {
  const { data, setupState, ctx } = instance
  const keys = new Set<string>()
  const ret = Object.create(null)
  Object.keys(setupState).forEach(key => {
    keys.add(key)
    ret[key] = setupState[key]
  })
  if (data) {
    Object.keys(data).forEach(key => {
      if (!keys.has(key)) {
        keys.add(key)
        ret[key] = data[key]
      }
    })
  }
  if (__FEATURE_OPTIONS_API__) {
    if (ctx.$computedKeys) {
      ;(ctx.$computedKeys as string[]).forEach((key: string) => {
        if (!keys.has(key)) {
          keys.add(key)
          ret[key] = ctx[key]
        }
      })
    }
  }
  if (ctx.$mp) {
    // TODO
    extend(ret, (ctx.$mp as any).data || {})
  }
  // TODO form-field
  // track
  return { keys, data: JSON.parse(JSON.stringify(ret)) }
}

export function patch(instance: ComponentInternalInstance) {
  const ctx = instance.ctx
  const mpType = ctx.mpType as MPType
  if (mpType === 'page' || mpType === 'component') {
    const start = Date.now()
    const mpInstance = ctx.$scope as MPInstance
    const { keys, data } = getVueInstanceData(instance)
    // data.__webviewId__ = mpInstance.data.__webviewId__
    const diffData = diff(data, getMPInstanceData(mpInstance, keys))
    if (Object.keys(diffData).length) {
      if (process.env.VUE_APP_DEBUG) {
        console.log(
          '[' +
            +new Date() +
            '][' +
            (mpInstance.is || mpInstance.route) +
            '][' +
            instance.uid +
            '][耗时' +
            (Date.now() - start) +
            ']差量更新',
          JSON.stringify(diffData)
        )
      }
      ctx.__next_tick_pending = true
      mpInstance.setData(diffData, () => {
        ctx.__next_tick_pending = false
        flushCallbacks(instance)
      })
    } else {
      flushCallbacks(instance)
    }
  }
}
