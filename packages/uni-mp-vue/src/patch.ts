import { ComponentInternalInstance } from '@vue/runtime-core'
import { MPType } from './renderer'

import { diff } from './diff'
import { flushCallbacks } from './nextTick'

import { flushPreFlushCbs } from '../../runtime-core/src/scheduler'
import { Data } from '../../runtime-core/src/component'
import { deepCopy } from './deepCopy'
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

export function patch(
  instance: ComponentInternalInstance,
  data: Data,
  oldData?: Data
) {
  if (!data) {
    return
  }
  // TODO 微信小程序会对 props 序列化，目前通过序列化再次触发数据响应式收集，因为 render 中收集的数据可能不全面（也不能仅仅这里收集，render 中也要收集），导致子组件无法局部响应式更新
  // 举例：
  // uni-indexed-list 组件传递 item 给 uni-indexed-list-item 组件，uni-indexed-list-item 发送点击到 uni-indexed-list 组件中修改 item.checked
  // uni-indexed-list 组件 render 中并未访问 item.checked（在 uni-indexed-list-item 中访问了，但被小程序序列化了，无法响应式），故无法收集依赖
  data = deepCopy(data) as Data
  // data = JSON.parse(JSON.stringify(data))

  const ctx = instance.ctx
  const mpType = ctx.mpType as MPType
  if (mpType === 'page' || mpType === 'component') {
    data.r0 = 1 // ready
    const start = Date.now()
    const mpInstance = ctx.$scope as MPInstance
    const keys = Object.keys(data)
    // data.__webviewId__ = mpInstance.data.__webviewId__
    const diffData = diff(data, oldData || getMPInstanceData(mpInstance, keys))
    if (Object.keys(diffData).length) {
      if (process.env.UNI_DEBUG) {
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
      // props update may have triggered pre-flush watchers.
      flushPreFlushCbs(undefined, instance.update)
    } else {
      flushCallbacks(instance)
    }
  }
}
