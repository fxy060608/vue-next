import { UniElement, UniEvent, UniEventListener } from '@dcloudio/uni-shared'

import { hyphenate, isArray } from '@vue/shared'
import {
  ComponentInternalInstance,
  callWithAsyncErrorHandling
} from '@vue/runtime-core'
import { ErrorCodes } from 'packages/runtime-core/src/errorHandling'

interface Invoker extends UniEventListener {
  value: EventValue
}

type EventValue = Function | Function[]

export function addEventListener(
  el: UniElement,
  event: string,
  handler: UniEventListener,
  options?: EventListenerOptions
) {
  el.addEventListener(event, handler, options)
}

export function removeEventListener(
  el: UniElement,
  event: string,
  handler: UniEventListener,
  options?: EventListenerOptions
) {
  el.removeEventListener(event, handler, options)
}

export function patchEvent(
  el: UniElement & { _vei?: Record<string, Invoker | undefined> },
  rawName: string,
  prevValue: EventValue | null,
  nextValue: EventValue | null,
  instance: ComponentInternalInstance | null = null
) {
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]
  if (nextValue && existingInvoker) {
    // patch
    existingInvoker.value = nextValue
  } else {
    const [name, options] = parseName(rawName)
    if (nextValue) {
      // add
      const invoker = (invokers[rawName] = createInvoker(nextValue, instance))
      addEventListener(el, name, invoker, options)
    } else if (existingInvoker) {
      // remove
      removeEventListener(el, name, existingInvoker, options)
      invokers[rawName] = undefined
    }
  }
}

const optionsModifierRE = /(?:Once|Passive|Capture)$/

function parseName(name: string): [string, EventListenerOptions | undefined] {
  let options: EventListenerOptions | undefined
  if (optionsModifierRE.test(name)) {
    options = {}
    let m
    while ((m = name.match(optionsModifierRE))) {
      name = name.slice(0, name.length - m[0].length)
      ;(options as any)[m[0].toLowerCase()] = true
      options
    }
  }
  return [hyphenate(name.slice(2)), options]
}

function createInvoker(
  initialValue: EventValue,
  instance: ComponentInternalInstance | null
) {
  const invoker: Invoker = (e: UniEvent) => {
    callWithAsyncErrorHandling(
      invoker.value,
      instance,
      ErrorCodes.NATIVE_EVENT_HANDLER,
      [e]
    )
  }
  invoker.value = initialValue
  const modifiers = new Set<string>()
  // 合并 modifiers
  if (isArray(invoker.value)) {
    invoker.value.forEach(v => {
      if ((v as any).modifiers) {
        ;(v as any).modifiers.forEach((m: string) => {
          modifiers.add(m)
        })
      }
    })
  } else {
    if ((invoker.value as any).modifiers) {
      ;(invoker.value as any).modifiers.forEach((m: string) => {
        modifiers.add(m)
      })
    }
    initWxsEvent(invoker, instance)
  }
  ;(invoker as any).modifiers = [...modifiers]
  return invoker
}

function initWxsEvent(
  invoker: Invoker,
  instance: ComponentInternalInstance | null
) {
  if (!instance) {
    return
  }
  const { $wxsModules } = (instance as unknown) as { $wxsModules: string[] }
  if (!$wxsModules) {
    return
  }
  const invokerSourceCode = invoker.value.toString()
  if (
    !$wxsModules.find(
      module => invokerSourceCode.indexOf('.' + module + '.') > -1
    )
  ) {
    return
  }
  ;(invoker as any).wxsEvent = (invoker.value as Function)()
}
