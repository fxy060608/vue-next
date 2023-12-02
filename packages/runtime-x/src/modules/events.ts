import {
  Element as UniXElement,
  Event as UniXEvent
} from '@dcloudio/uni-app-x/types/native'

import { hyphenate, isArray } from '@vue/shared'
import {
  ComponentInternalInstance,
  callWithAsyncErrorHandling
} from '@vue/runtime-core'
import { ErrorCodes } from 'packages/runtime-core/src/errorHandling'

type UniXEventListener = (e: UniXEvent) => any

interface Invoker extends UniXEventListener {
  value: EventValue
}

type EventValue = Function | Function[]

export function addEventListener(
  el: UniXElement,
  event: string,
  handler: UniXEventListener,
  options?: EventListenerOptions
) {
  el.addEventListener(event, handler)
}

export function removeEventListener(el: UniXElement, event: string) {
  el.removeEventListener(event)
}

export function patchEvent(
  el: UniXElement & { _vei?: Record<string, Invoker | undefined> },
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
      removeEventListener(el, name)
      invokers[rawName] = undefined
    }
  }
}

const optionsModifierRE = /(?:Once|Passive|Capture)$/

function formatEventName(name: string) {
  if (name === 'on-post-message') {
    return 'onPostMessage'
  }
  return name
}
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
  const event = name[2] === ':' ? name.slice(3) : name.slice(2)
  return [formatEventName(hyphenate(event)), options]
}

function createInvoker(
  initialValue: EventValue,
  instance: ComponentInternalInstance | null
) {
  const invoker: Invoker = (e: UniXEvent) => {
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
  }
  ;(invoker as any).modifiers = [...modifiers]
  return invoker
}
