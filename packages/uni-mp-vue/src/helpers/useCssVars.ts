import {
  getCurrentInstance,
  warn,
  ComponentInternalInstance
} from '@vue/runtime-core'
/**
 * Runtime helper for SFC's CSS variable injection feature.
 * @private
 */
export function useCssVars(getter: (ctx: any) => Record<string, string>) {
  if (!__BROWSER__ && !__TEST__) return

  const instance = getCurrentInstance()
  /* istanbul ignore next */
  if (!instance) {
    __DEV__ &&
      warn(`useCssVars is called without current active component instance.`)
    return
  }
  initCssVarsRender(instance, getter)
}

function initCssVarsRender(
  instance: ComponentInternalInstance,
  getter: (ctx: any) => Record<string, string>
) {
  instance.ctx.__cssVars = () => {
    const vars = getter(instance.proxy!)
    const cssVars: Record<string, string> = {}
    for (const key in vars) {
      cssVars[`--${key}`] = vars[key]
    }
    return cssVars
  }
}
