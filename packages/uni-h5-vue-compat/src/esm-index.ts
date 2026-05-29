import Vue from './runtime'

export default Vue
export * from '@vue/runtime-dom'

const configureCompat: typeof Vue.configureCompat = Vue.configureCompat
export { configureCompat }
export { createApp as createVueApp } from '@vue/runtime-dom'
