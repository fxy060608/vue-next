import { unref } from '@vue/reactivity'
import {
  AsyncComponentLoader,
  AsyncComponentOptions,
  Component,
  ComponentPublicInstance
} from '@vue/runtime-core'
import { queue, SchedulerJob } from '../../runtime-core/src/scheduler'

export function unwrapper<T>(target: T) {
  return unref(target)
}

export function defineAsyncComponent<
  T extends Component = { new (): ComponentPublicInstance }
>(source: AsyncComponentLoader<T> | AsyncComponentOptions<T>) {
  console.error('defineAsyncComponent is unsupported')
}

export function invalidateJob(job: SchedulerJob) {
  const i = queue.indexOf(job)
  if (i > -1) {
    queue.splice(i, 1)
  }
}
