import type { NVueElement } from '@dcloudio/uni-shared'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import { parseStyleSheet } from '../helpers/useCssStyles'

/**
 * 当前仅 patch 到 el 中，真正更新则是在 el 中
 * @param el
 * @param pre
 * @param next
 * @param instance
 * @returns
 */
export function patchClass(
  el: NVueElement,
  pre: string | null,
  next: string | null,
  instance: ComponentInternalInstance | null = null
) {
  if (!instance) {
    return
  }
  const classList = next ? next.split(' ') : []
  el.setClassList(classList)
  el.setStyleSheet(parseStyleSheet(instance))
}
