import { extend, isObject } from '@vue/shared'
import {
  App,
  AppConfig,
  AppContext,
  Component,
  ComponentOptions,
  ConcreteComponent,
  createSSRApp,
  Directive
} from '@vue/runtime-dom'

function createVueAppContext(): AppContext {
  return {
    app: null as any,
    config: {
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: undefined,
      warnHandler: undefined
    } as AppContext['config'], //ignore isNativeTag,isCustomElement
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null)
  }
}

let currentApp: App
let currentPlugins: unknown[]

export function createVueSSRApp(
  rootComponent: Component,
  rootProps: Record<string, unknown> | null = null
) {
  if (rootProps != null && !isObject(rootProps)) {
    rootProps = null
  }
  currentPlugins = []
  const context = createVueAppContext()
  const app: App = (context.app = currentApp = {
    _uid: -1,
    _component: rootComponent as ConcreteComponent,
    _props: rootProps,
    _container: null,
    _context: context,
    version: __VERSION__,
    get config() {
      return context.config
    },
    set config(_v) {},

    use(plugin, ...options) {
      currentPlugins.push([plugin, ...options])
      return app
    },

    mixin(mixin) {
      context.mixins.push(mixin)
      return app
    },

    component(name: string, component?: Component): any {
      if (!component) {
        return context.components[name]
      }
      context.components[name] = component
      return app
    },

    directive(name: string, directive?: Directive) {
      if (!directive) {
        return context.directives[name] as any
      }
      context.directives[name] = directive
      return app
    },
    mount(): any {},
    unmount() {},
    provide(key, value) {
      context.provides[key as string] = value
      return app
    }
  })
  return app
}

export function createVueSSRAppInstance() {
  const app = createSSRApp(currentApp._component, currentApp._props)
  const {
    config,
    mixins,
    components,
    directives,
    provides
  } = currentApp._context
  initAppConfig(app, config)
  initAppPlugins(app, currentPlugins)
  initAppMixins(app, mixins)
  initAppComponents(app, components)
  initAppDirectives(app, directives)
  initAppProvides(app, provides)
  return app
}

function initAppConfig(
  app: App,
  {
    performance,
    globalProperties,
    optionMergeStrategies,
    errorHandler,
    warnHandler
  }: AppConfig
) {
  const { config } = app
  extend(config, { performance, errorHandler, warnHandler })
  extend(config.globalProperties, globalProperties)
  extend(config.optionMergeStrategies, optionMergeStrategies)
  return app
}

function initAppMixins(app: App, mixins: ComponentOptions[]) {
  mixins.forEach(mixin => app.mixin(mixin))
  return app
}

function initAppComponents(app: App, components: Record<string, any>) {
  Object.keys(components).forEach(name => app.component(name, components[name]))
  return app
}

function initAppDirectives(app: App, directives: Record<string, Directive>) {
  Object.keys(directives).forEach(name => app.directive(name, directives[name]))
  return app
}

function initAppProvides(app: App, provides: Record<string, any>) {
  Object.keys(provides).forEach(name => app.provide(name, provides[name]))
  return app
}

function initAppPlugins(app: App, plugins: any[]) {
  plugins.forEach(plugin => app.use.apply(app, plugin))
  return app
}
