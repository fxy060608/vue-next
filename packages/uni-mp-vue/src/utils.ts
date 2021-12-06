import { unref } from '@vue/reactivity'
import {
  AsyncComponentLoader,
  AsyncComponentOptions,
  Component,
  ComponentPublicInstance
} from '@vue/runtime-core'

export function unwrapper<T>(target: T) {
  return unref(target)
}

export function defineAsyncComponent<
  T extends Component = { new (): ComponentPublicInstance }
>(source: AsyncComponentLoader<T> | AsyncComponentOptions<T>) {
  console.error('defineAsyncComponent is unsupported')
}
