import { IPageManager } from '@dcloudio/uni-app-x/types/native'

declare module '@dcloudio/uni-app-x/types/native' {
  interface Element {
    setAnyAttribute(key: string, value: any | null): void
    getAnyAttribute(key: string): any | null
  }
}

declare global {
  const __pageManager: IPageManager
}
