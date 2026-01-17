export let __X_STYLE_ISOLATION__ = false

export function enableStyleIsolation() {
  __X_STYLE_ISOLATION__ = true
}

export enum UniSharedDataComponentStyleIsolation {
  Isolated,
  App,
  AppAndPage,
}
