import { ElementWithTransition } from '../components/Transition'

// compiler should normalize class + :class bindings on the same element
// into a single binding ['staticClass', dynamic]
export function patchClass(el: Element, value: string | null, isSVG: boolean) {
  // directly setting className should be faster than setAttribute in theory
  // if this is an element during a transition, take the temporary transition
  // classes into account.
  // fixed by xxxxxx wxs
  const { __wxsAddClass, __wxsRemoveClass } = el as unknown as {
    __wxsAddClass: string[]
    __wxsRemoveClass: string[]
  }
  if (__wxsRemoveClass && __wxsRemoveClass.length) {
    value = (value || '')
      .split(/\s+/)
      .filter(v => __wxsRemoveClass.indexOf(v) === -1)
      .join(' ')
    __wxsRemoveClass.length = 0
  }
  if (__wxsAddClass && __wxsAddClass.length) {
    value = (value || '') + ' ' + __wxsAddClass.join(' ')
  }
  const transitionClasses = (el as ElementWithTransition)._vtc
  if (transitionClasses) {
    value = (
      value ? [value, ...transitionClasses] : [...transitionClasses]
    ).join(' ')
  }
  if (value == null) {
    el.removeAttribute('class')
  } else if (isSVG) {
    el.setAttribute('class', value)
  } else {
    el.className = value
  }
}
