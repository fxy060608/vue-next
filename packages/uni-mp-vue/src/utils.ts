import { unref } from '@vue/reactivity'

export function unwrapper<T>(target: T) {
  return unref(target)
}
