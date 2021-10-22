import { ComponentInternalInstance } from '@vue/runtime-core'
import { MPType } from './renderer'

import diff from './diff'
import { flushCallbacks } from './nextTick'

import { flushPreFlushCbs } from '../../runtime-core/src/scheduler'
import { Data } from '../../runtime-core/src/component'
import { pauseTracking, resetTracking } from '@vue/reactivity'

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

function getMPInstanceData(instance: MPInstance, keys: string[]) {
  const data = instance.data
  const ret = Object.create(null)
  //仅同步 data 中有的数据
  keys.forEach(key => {
    ret[key] = data[key]
  })
  return ret
}

export function patch(instance: ComponentInternalInstance, data: Data) {
  if (!data) {
    return
  }
  // 序列化
  pauseTracking()
  data = JSON.parse(JSON.stringify(data))
  resetTracking()
  const ctx = instance.ctx
  const mpType = ctx.mpType as MPType
  if (mpType === 'page' || mpType === 'component') {
    data.r0 = 1 // ready
    const start = Date.now()
    const mpInstance = ctx.$scope as MPInstance
    const keys = Object.keys(data)
    // data.__webviewId__ = mpInstance.data.__webviewId__
    const diffData = diff(data, getMPInstanceData(mpInstance, keys))
    if (Object.keys(diffData).length) {
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
      ctx.__next_tick_pending = true
      mpInstance.setData(diffData, () => {
        ctx.__next_tick_pending = false
        flushCallbacks(instance)
      })
      // props update may have triggered pre-flush watchers.
      flushPreFlushCbs(undefined, instance.update)
    } else {
      flushCallbacks(instance)
    }
  }
}
