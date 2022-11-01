import {
  ComponentInternalInstance,
  ComponentPublicInstance,
  onBeforeUnmount
} from '@vue/runtime-core'
import type { VNodeNormalizedRefAtom } from 'packages/runtime-core/src/vnode'
import { Data, getExposeProxy } from 'packages/runtime-core/src/component'
import { hasOwn, isArray, isFunction, isString, remove } from '@vue/shared'
import { isRef } from '@vue/reactivity'
import { warn } from 'packages/runtime-core/src/warning'
import { MPInstance } from './patch'
import { nextTick } from './nextTick'

export type TemplateRef = Omit<VNodeNormalizedRefAtom, 'i'> & {
  i: string
}

interface TemplateRefsComponentInternalInstance
  extends ComponentInternalInstance {
  ctx: {
    $scope: MPInstance
    $mpPlatform: 'mp-alipay'
  }
  $templateRefs: TemplateRef[]
}

/**
 * Function for handling a template ref
 */
export function setRef(instance: ComponentInternalInstance, isUnmount = false) {
  const {
    setupState,
    $templateRefs,
    ctx: { $scope, $mpPlatform }
  } = instance as TemplateRefsComponentInternalInstance
  if ($mpPlatform === 'mp-alipay') {
    return
  }
  if (!$templateRefs || !$scope) {
    return
  }
  if (isUnmount) {
    return $templateRefs.forEach(templateRef =>
      setTemplateRef(templateRef, null, setupState)
    )
  }
  const check = $mpPlatform === 'mp-baidu' || $mpPlatform === 'mp-toutiao'

  const doSetByRefs = (refs: TemplateRef[]) => {
    const mpComponents =
      // 字节小程序 selectAllComponents 可能返回 null
      // https://github.com/dcloudio/uni-app/issues/3954
      ($scope.selectAllComponents('.r') || []).concat(
        $scope.selectAllComponents('.r-i-f') || []
      )
    return refs.filter(templateRef => {
      const refValue = findComponentPublicInstance(mpComponents, templateRef.i)
      // 部分平台，在一些 if 条件下，部分 slot 组件初始化会被延迟到下一次渲染，需要二次检测
      if (check && refValue === null) {
        return true
      }
      setTemplateRef(templateRef, refValue, setupState)
      return false
    })
  }

  const doSet = () => {
    const refs = doSetByRefs($templateRefs)
    if (refs.length && instance.proxy && (instance.proxy as any).$scope) {
      ;(instance.proxy as any).$scope.setData({ r1: 1 }, () => {
        doSetByRefs(refs)
      })
    }
  }

  if ($scope._$setRef) {
    $scope._$setRef(doSet)
  } else {
    nextTick(instance, doSet)
  }
}

function findComponentPublicInstance(mpComponents: MPInstance[], id: string) {
  const mpInstance = mpComponents.find(
    com => com && (com.properties || com.props).uI === id
  )
  if (mpInstance) {
    const vm = mpInstance.$vm
    if (vm) {
      return getExposeProxy(vm.$) || vm
    }
    // 可能是原生组件
    return mpInstance
  }
  return null
}

export function setTemplateRef(
  { r, f }: TemplateRef,
  refValue: ComponentPublicInstance | Record<string, any> | null,
  setupState: Data
) {
  if (isFunction(r)) {
    r(refValue as ComponentPublicInstance, {})
  } else {
    const _isString = isString(r)
    const _isRef = isRef(r)
    if (_isString || _isRef) {
      if (f) {
        if (!_isRef) {
          return
        }
        if (!isArray(r.value)) {
          r.value = []
        }
        const existing = r.value as Array<
          ComponentPublicInstance | Record<string, any> | null
        >
        if (existing.indexOf(refValue) === -1) {
          existing.push(refValue)
          if (!refValue) {
            return
          }
          // 实例销毁时，移除
          onBeforeUnmount(() => remove(existing, refValue), refValue.$)
        }
      } else if (_isString) {
        if (hasOwn(setupState, r)) {
          setupState[r] = refValue
        }
      } else if (isRef(r)) {
        r.value = refValue
      } else if (__DEV__) {
        warnRef(r)
      }
    } else if (__DEV__) {
      warnRef(r)
    }
  }
}

function warnRef(ref: unknown) {
  warn('Invalid template ref type:', ref, `(${typeof ref})`)
}
