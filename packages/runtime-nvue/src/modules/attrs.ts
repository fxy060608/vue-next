import type { NVueElement } from '@dcloudio/uni-shared'
import type { ComponentInternalInstance } from '@vue/runtime-core'
import {
  normalizeStyle,
  parseStringStyle,
  isString,
  camelize
} from '@vue/shared'
import { parseClassList } from '../helpers'

export function patchAttr(
  el: NVueElement,
  key: string,
  value: unknown,
  instance: ComponentInternalInstance | null = null
) {
  if (instance) {
    ;[key, value] = transformAttr(el, key, value, instance)
  }
  if (value == null) {
    // TODO remove
  } else {
    el.setAttr(key, value)
  }
}

const ATTR_HOVER_CLASS = 'hoverClass'
const ATTR_PLACEHOLDER_CLASS = 'placeholderClass'
const ATTR_PLACEHOLDER_STYLE = 'placeholderStyle'
const ATTR_INDICATOR_CLASS = 'indicatorClass'
const ATTR_INDICATOR_STYLE = 'indicatorStyle'
const ATTR_MASK_CLASS = 'maskClass'
const ATTR_MASK_STYLE = 'maskStyle'

const CLASS_AND_STYLES: Record<string, { class: string[]; style: string[] }> = {
  view: {
    class: [ATTR_HOVER_CLASS],
    style: []
  },
  button: {
    class: [ATTR_HOVER_CLASS],
    style: []
  },
  navigator: {
    class: [ATTR_HOVER_CLASS],
    style: []
  },
  'u-input': {
    class: [ATTR_PLACEHOLDER_CLASS],
    style: [ATTR_PLACEHOLDER_STYLE]
  },
  'u-textarea': {
    class: [ATTR_PLACEHOLDER_CLASS],
    style: [ATTR_PLACEHOLDER_STYLE]
  },
  'picker-view': {
    class: [ATTR_INDICATOR_CLASS, ATTR_MASK_CLASS],
    style: [ATTR_INDICATOR_STYLE, ATTR_MASK_STYLE]
  }
}

function transformAttr(
  el: NVueElement,
  key: string,
  value: unknown,
  instance: ComponentInternalInstance
): [string, unknown] {
  if (!value) {
    return [key, value]
  }
  const opts = CLASS_AND_STYLES[el.type]
  if (opts) {
    const camelized = camelize(key)
    if (opts['class'].indexOf(camelized) > -1) {
      return [camelized, parseClassList([value as string], instance, el)]
    }
    if (opts['style'].indexOf(key) > -1) {
      if (isString(value)) {
        return [camelized, parseStringStyle(value)]
      }
      return [camelized, normalizeStyle(value)]
    }
  }
  return [key, value]
}
