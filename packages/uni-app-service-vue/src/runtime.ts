export * from '@vue/runtime-service'

// 在h5平台测试时，需要的mock
export function onBeforeActivate() {}
export function onBeforeDeactivate() {}
export { createApp as createVueApp } from '@vue/runtime-service'
